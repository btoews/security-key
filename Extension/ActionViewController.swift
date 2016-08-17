//
//  ActionViewController.swift
//  Extension
//
//  Created by Benjamin P Toews on 8/16/16.
//  Copyright © 2016 mastahyeti. All rights reserved.
//

import UIKit
import MobileCoreServices

class ActionViewController: UIViewController {

    override func viewDidLoad() {
        super.viewDidLoad()
        
        let keyName: String = "com.trailofbits.tidas.public"

        let message: NSData = "hello world!".dataUsingEncoding(NSUTF8StringEncoding)!
        
        if KeyInterface.publicKeyExists(keyName) {
            print("key pair exists")
            print(KeyInterface.publicKeyBits(keyName))
        } else {
            if KeyInterface.generateTouchIDKeyPair(keyName) {
                print("generated key pair")
                print(KeyInterface.publicKeyBits(keyName))
            } else {
                print("error generating key pair")
            }
        }
        
        KeyInterface.generateSignatureForData(message, withKeyName: keyName) {
            (msg, err) in
            print(msg)
        }
        
        KeyInterface.deletePubKey(keyName)
        KeyInterface.deletePrivateKey(keyName)
        
        navigationItem.rightBarButtonItem = UIBarButtonItem(barButtonSystemItem: .Done, target: self, action: #selector(done))
        
        if let inputItem = extensionContext!.inputItems.first as? NSExtensionItem {
            if let itemProvider = inputItem.attachments?.first as? NSItemProvider {
                itemProvider.loadItemForTypeIdentifier(kUTTypePropertyList as String, options: nil) { (dict, error) in
                    let itemDictionary = dict as! NSDictionary
                    let javaScriptValues = itemDictionary[NSExtensionJavaScriptPreprocessingResultsKey] as! NSDictionary
                    
                    print(javaScriptValues)
                }
            }
        }
    }

    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
    }

    @IBAction func done() {
        self.extensionContext!.completeRequestReturningItems(self.extensionContext!.inputItems, completionHandler: nil)
    }

}
