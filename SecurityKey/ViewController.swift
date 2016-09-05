//
//  ViewController.swift
//  SecurityKey
//
//  Created by Benjamin P Toews on 8/16/16.
//  Copyright © 2016 GitHub, inc. All rights reserved.
//

import UIKit

class ViewController: UIViewController {


    override func viewDidLoad() {
        super.viewDidLoad()
    }

    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
        // Dispose of any resources that can be recreated.
    }

    @IBAction func creditsButtonPressed() {
        UIApplication.shared.openURL(URL(string: "https://github.com/mastahyeti/security-key/blob/master/CREDITS.md")!)
    }
}
