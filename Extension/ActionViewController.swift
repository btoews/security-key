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
    
    func signMessage(keyName:String, _ message:String, completion: (NSData!, NSError!) -> Void) {
        let messageData:NSData = message.dataUsingEncoding(NSUTF8StringEncoding)!
        
        if KeyInterface.publicKeyExists(keyName) {
            print("key pair exists")
        } else {
            if KeyInterface.generateTouchIDKeyPair(keyName) {
                print("generated key pair")
            } else {
                print("error generating key pair")
            }
        }
        
        KeyInterface.generateSignatureForData(messageData, withKeyName: keyName, withCompletion: completion)
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        
        navigationItem.rightBarButtonItem = UIBarButtonItem(barButtonSystemItem: .Done, target: self, action: #selector(done))
        
        guard
            let inputItem = extensionContext!.inputItems.first as? NSExtensionItem,
            let itemProvider = inputItem.attachments?.first as? NSItemProvider
        else {
            return
        }
        
        
        itemProvider.loadItemForTypeIdentifier(kUTTypePropertyList as String, options: nil) { (dict, error) in
            let itemDictionary = dict as! NSDictionary
            let javaScriptValues = itemDictionary[NSExtensionJavaScriptPreprocessingResultsKey] as! NSDictionary
            
            guard
                let origin = javaScriptValues["origin"] as? String,
                let message = javaScriptValues["message"] as? String
            else {
                return
            }
            
            self.signMessage(origin, message) { (sig, err) in
                print(sig)
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
