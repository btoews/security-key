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
    
    func signMessage(keyName:String, _ message:String, completion: (NSData!, NSError!) -> Void) {
        let messageData:NSData = message.dataUsingEncoding(NSUTF8StringEncoding)!
        
        if KeyInterface.publicKeyExists(keyName) {
            print("key pair exists")
        } else {
            if KeyInterface.generateTouchIDKeyPair(keyName) {
                print("generated key pair")
            } else {
                completion(nil, NSError(domain: "com.github.SecurityKey.Extension", code: 1, userInfo: [:]))
                print("error generating key pair")
                return
            }
        }
        
        KeyInterface.generateSignatureForData(messageData, withKeyName: keyName, withCompletion: completion)
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
                                let dictionary = item as! NSDictionary
                                let javaScriptValues = dictionary[NSExtensionJavaScriptPreprocessingResultsKey] as! NSDictionary

                                NSOperationQueue.mainQueue().addOperationWithBlock {
                                    self.itemLoadCompletedWithPreprocessingResults(javaScriptValues)
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
            let origin = javaScriptValues["origin"] as? String,
            let message = javaScriptValues["message"] as? String
            else {
                return
        }
        
        self.signMessage(origin, message) { (sig, err) in
            if err == nil {
                let strSig = String(data: sig, encoding: NSASCIIStringEncoding)!
                let key = KeyInterface.publicKeyBits(origin)
                let strKey = String(data: key, encoding: NSASCIIStringEncoding)!

                self.doneWithResults(["signature": strSig, "key": strKey])
            } else {
                self.doneWithResults(["error": "failed to sign message"])
            }
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
