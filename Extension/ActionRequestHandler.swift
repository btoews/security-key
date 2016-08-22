//
//  ActionRequestHandler.swift
//  Extension
//
//  Created by Benjamin P Toews on 8/16/16.
//  Copyright © 2016 mastahyeti. All rights reserved.
//

import UIKit
import MobileCoreServices

class ActionRequestHandler: NSObject, NSExtensionRequestHandling {
    
    var extensionContext: NSExtensionContext?
    
    func generateOrGetKeyWithName(name:String) -> NSData? {
        if KeyInterface.publicKeyExists(name) {
            print("key pair exists")
        } else {
            if KeyInterface.generateTouchIDKeyPair(name) {
                print("generated key pair")
            } else {
                print("error generating key pair")
                return nil
            }
        }
        
        return KeyInterface.publicKeyBits(name)
    }

    func beginRequestWithExtensionContext(context: NSExtensionContext) {
        self.extensionContext = context
        
        var found = false
        
        outer:
            for item: AnyObject in context.inputItems {
                let extItem = item as! NSExtensionItem
                if let attachments = extItem.attachments {
                    for itemProvider: AnyObject in attachments {
                        if itemProvider.hasItemConformingToTypeIdentifier(kUTTypePropertyList as String) {
                            itemProvider.loadItemForTypeIdentifier(kUTTypePropertyList as String, options: nil, completionHandler: { (item, error) in
                                if let dictionary = item as? NSDictionary, let javaScriptValues = dictionary[NSExtensionJavaScriptPreprocessingResultsKey] as? NSDictionary {
                                    NSOperationQueue.mainQueue().addOperationWithBlock {
                                        self.itemLoadCompletedWithPreprocessingResults(javaScriptValues)
                                    }
                                }
                            })
                            found = true
                            break outer
                        }
                    }
                }
        }
        
        if !found {
            self.doneWithResults(["error": "failed to find message"])
        }
    }
    
    func itemLoadCompletedWithPreprocessingResults(javaScriptValues: NSDictionary) {
        guard
            let appId = javaScriptValues["appId"] as? String,
            let jsonToSign = javaScriptValues["toSign"] as? String,
            let toSign = decodeJsonByteArrayAsString(jsonToSign)
        else {
            print("bad data from JavaScript")
            return
        }
        
        guard
            let key = generateOrGetKeyWithName(appId),
            let strKey = String(data: key, encoding: NSASCIIStringEncoding)
        else {
            print("error generating or finding key")
            return
        }
        
        guard let ssc = SelfSignedCertificate()
        else {
            print("error generating certificate")
            return
        }
        
        let fullToSign = NSMutableData()
        fullToSign.appendData(toSign)
        fullToSign.appendData(key)
       
        guard let sig = ssc.signData(fullToSign)
        else {
            print("error signing register request")
            return
        }
        
        self.doneWithResults([
            "signature": sig,
            "publicKey": strKey,
            "certificate": ssc.toDer()
        ])
        
        
//        KeyInterface.generateSignatureForData(toSign, withKeyName: appId) { (sig, err) in
//            if err == nil {
//                let strSig = String(data: sig, encoding: NSASCIIStringEncoding)!
//                let strKey = String(data: key, encoding: NSASCIIStringEncoding)!
//                
//                self.doneWithResults(["signature": strSig, "publicKey": strKey])
//            } else {
//                self.doneWithResults(["error": "failed to sign message"])
//            }
//        }
    }
    
    // There were encoding issues passing a binary string from JavaScript. My shitty solution is to
    // JSON serialize a byte array in JavaScript and decode it here...
    func decodeJsonByteArrayAsString(raw: String) -> NSData? {
        guard let rawData = raw.dataUsingEncoding(NSUTF8StringEncoding) else {
            print("error converting raw to data")
            return nil
        }

        do {
            if let ints = try NSJSONSerialization.JSONObjectWithData(rawData, options: []) as? [Int] {
                let uints = ints.map { UInt8($0) }
                return NSData(bytes: uints, length: uints.count)
            } else {
                print("bad json data")
                return nil
            }
        } catch {
            print("error deserializing json")
            return nil
        }
    }
    
    func doneWithResults(resultsForJavaScriptFinalizeArg: [NSObject: AnyObject]?) {
        if let resultsForJavaScriptFinalize = resultsForJavaScriptFinalizeArg {
            let resultsDictionary = [NSExtensionJavaScriptFinalizeArgumentKey: resultsForJavaScriptFinalize]
            let resultsProvider = NSItemProvider(item: resultsDictionary, typeIdentifier: String(kUTTypePropertyList))
            let resultsItem = NSExtensionItem()
            resultsItem.attachments = [resultsProvider]
            
            self.extensionContext!.completeRequestReturningItems([resultsItem], completionHandler: nil)
        } else {
            self.extensionContext!.completeRequestReturningItems([], completionHandler: nil)
        }
        
        self.extensionContext = nil
    }
}
