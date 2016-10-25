//
//  ActionRequestHandler.swift
//  Extension
//
//  Created by Benjamin P Toews on 8/16/16.
//  Copyright © 2016 GitHub, inc. All rights reserved.
//

import UIKit
import MobileCoreServices

class ActionRequestHandler: NSObject, NSExtensionRequestHandling {

    var extensionContext: NSExtensionContext?

    func beginRequest(with context: NSExtensionContext) {
        print("beginRequestWithExtensionContext")
        self.extensionContext = context

        var found = false

        outer:
            for item: Any in context.inputItems {
                let extItem = item as! NSExtensionItem
                if let attachments = extItem.attachments {
                    for itemProvider: Any in attachments {
                        let extItemProvider = itemProvider as! NSItemProvider
                        if extItemProvider.hasItemConformingToTypeIdentifier(kUTTypePropertyList as String) {
                            extItemProvider.loadItem(forTypeIdentifier: kUTTypePropertyList as String, options: nil, completionHandler: { (item, error) in
                                if let dictionary = item as? NSDictionary, let javaScriptValues = dictionary[NSExtensionJavaScriptPreprocessingResultsKey] as? NSDictionary {
                                    OperationQueue.main.addOperation {
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

    func itemLoadCompletedWithPreprocessingResults(_ javaScriptValues: NSDictionary) {
        guard let reqType = javaScriptValues["type"] as? String else {
            print("bad request type")
            return
        }

        switch reqType {
        case "register":
            handleRegisterRequest(javaScriptValues)
        case "sign":
            handleSignRequest(javaScriptValues)
        default:
            print("bad request")
            return
        }
    }

    func handleRegisterRequest(_ javaScriptValues: NSDictionary) {
        guard
            let keyHandle = javaScriptValues["keyHandle"] as? String,
            let jsonToSign = javaScriptValues["toSign"] as? String,
            let toSign = decodeJsonByteArrayAsString(jsonToSign)
            else {
                print("bad register data from JavaScript")
                return
        }

        guard
            let key = generateOrGetKeyWithName(keyHandle),
            let strKey = String(data: key, encoding: String.Encoding.ascii)
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
        fullToSign.append(toSign)
        fullToSign.append(key)

        guard let sig = ssc.sign(fullToSign as Data!)
            else {
                print("error signing register request")
                return
        }

        self.doneWithResults([
            "signature": sig,
            "publicKey": strKey,
            "certificate": ssc.toDer()
        ])
    }

    func handleSignRequest(_ javaScriptValues: NSDictionary) {
        guard
            let keyHandle = javaScriptValues["keyHandle"] as? String,
            let jsonToSign = javaScriptValues["toSign"] as? String,
            let toSign = decodeJsonByteArrayAsString(jsonToSign)
            else {
                print("bad signing data from JavaScript")
                return
        }

        print("sign request. toSign: \(jsonToSign)")

        KeyInterface.generateSignature(for: toSign, withKeyName: keyHandle) { (sig, err) in
            if err == nil {
                let strSig = String(data: sig!, encoding: String.Encoding.ascii)!
                self.doneWithResults(["signature": strSig])
            } else {
                print("failed to sign message: \(err)")
                return
            }
        }
    }

    func doneWithResults(_ resultsForJavaScriptFinalizeArg: [AnyHashable: Any]?) {
        if let resultsForJavaScriptFinalize = resultsForJavaScriptFinalizeArg {
            let resultsDictionary = [NSExtensionJavaScriptFinalizeArgumentKey: resultsForJavaScriptFinalize]
            let resultsProvider = NSItemProvider(item: resultsDictionary as NSSecureCoding?, typeIdentifier: String(kUTTypePropertyList))
            let resultsItem = NSExtensionItem()
            resultsItem.attachments = [resultsProvider]

            self.extensionContext!.completeRequest(returningItems: [resultsItem], completionHandler: nil)
        } else {
            self.extensionContext!.completeRequest(returningItems: [], completionHandler: nil)
        }

        self.extensionContext = nil
    }

    func generateOrGetKeyWithName(_ name:String) -> Data? {
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

    // There were encoding issues passing a binary string from JavaScript. My shitty solution is to
    // JSON serialize a byte array in JavaScript and decode it here...
    func decodeJsonByteArrayAsString(_ raw: String) -> Data? {
        guard let rawData = raw.data(using: String.Encoding.utf8) else {
            print("error converting raw to data")
            return nil
        }

        do {
            if let ints = try JSONSerialization.jsonObject(with: rawData, options: []) as? [Int] {
                let uints = ints.map { UInt8($0) }
                return Data(bytes: UnsafePointer<UInt8>(uints), count: uints.count)
            } else {
                print("bad json data")
                return nil
            }
        } catch {
            print("error deserializing json")
            return nil
        }
    }
}
