# iOS Security Key

This app provides a iOS Safari extension, which implements the FIDO U2F protocol. The cryptographic keys used for authentication are generated and stored on the Secure Enclave Processor (SEP), requiring user interaction for signing operations.

## Setup

After installing the app, you'll need to enable the extension

##### Open Safari

<img src='https://cloud.githubusercontent.com/assets/1144197/18013743/c64639c6-6b7c-11e6-9ea8-c2f9d2b3b0bb.png' height='300px'>

##### Click the "share" button

<img src='https://cloud.githubusercontent.com/assets/1144197/18013745/c64e63b2-6b7c-11e6-9a9d-6c4459107d84.png' height='300px'>

##### Scroll to the right and click the "more" button

<img src='https://cloud.githubusercontent.com/assets/1144197/18013744/c649f99e-6b7c-11e6-9a7c-2f2bce101f97.png' height='300px'>

##### Ensure "Security Key" is enabled

<img src='https://cloud.githubusercontent.com/assets/1144197/18013746/c64ea5ca-6b7c-11e6-9537-be7a6e5c2d20.png' height='300px'>


## Protocol and implementaion details

### FIDO U2F

[FIDO U2F](https://fidoalliance.org/specs/fido-u2f-v1.0-nfc-bt-amendment-20150514/fido-u2f-overview.html) is a cryptographic protocol for [second factor authentication](https://en.wikipedia.org/wiki/Multi-factor_authentication). In addition to registering a username and password with a website, you also register a "security key". This key may be a hardware device like a USB dongle, or a software application on your device. When authenticating with the website, you provide your username and password, and are then prompted to interact with your security key. At this point the key strongly authenticates you by digitally signing a challenge from the website. The signature is sent to the website, which can verify its authenticity and finish authenticating your session.

Your web browser needs to facilitate the communication between the website you are authenticating with and your security key. Currently, only the Chrome and Opera browsers implement this protocol — FIDO U2F. This application adds an extension to the Safari browser on your iOS device, implementing FIDO U2F.

### Secure Enclave Processor (SEP)

A desirable characteristic of security keys is that they securely store the keys used for creating digital signatures. For example, USB security keys generate a new set of keys for each website you want to authenticate with. These keys are stored on the USB device and are impossible to extract. Even if malware is installed on your computer, your USB key can never be cloned. USB keys also require interaction, such as pressing a physical button, before they will use their stored keys for creating a signature. This provides a strong assurance for websites that it is actually *you* who is authenticating.

Modern iOS devices have a special chip called the [Secure Enclave Processor (SEP)](https://www.blackhat.com/docs/us-16/materials/us-16-Mandt-Demystifying-The-Secure-Enclave-Processor.pdf). This chip is responsible for cryptographic operations, such as generating keys and signing and encrypting messages. The SEP allows apps to generate sets of keys, such as those stored on USB security keys, specifying that they may never be exported. Additionally, the app may specify that in order for these keys to be used for signing, the user must biometrically verify her presence using [Touch ID](https://support.apple.com/en-us/HT201371).

### iOS Action Extension limitations

The iOS platform allows developers to create "Action Extensions", which are available to users while browsing the web. These extensions can include JavaScript, which runs in a separate sandbox from the website's JavaScript. This separation means that extensions cannot directly define JavaScript API's, like the U2F API<sup>1</sup> — `window.u2f`.

An added difficulty is that communications between the native and JavaScript components of the extension are limited. When the user invokes the extension, a JavaScript files is loaded. This file defines `run` and `finalize` functions. The `run` function is called and given a callback which allows the JavaScript to send data to the native side of the extension. When the native side is done, it calls the `finalize` function, passing any necessary data back to the JavaScript. This restrictive model of communication means that only one chance is given to pass information in either direction.

To facilitate the U2F protocol, this extension needs to allow the website to communicate with the extension. Of the available options, the best approach was to achieve this communication via DOM events. The website must include a JavaScript polyfill that defines the `window.u2f` API and sends registration and signing requests to the extension.

<sup>1</sup> The extension *could* inject a `<script>` tag, allowing it to run JavaScript outside of its sandbox, but this pattern is frustrating to web developers and interferes with security features like Content Security Policy.

### `window.u2f` polyfill

The polyfill can be found [here](./u2f_polyfill.js)


## Credits

This app was built using some fantastic open source librarires:

- [OpenSSL](https://www.openssl.org/) ([license](https://www.openssl.org/source/license.txt))
- [OpenSSL-for-iPhone](https://github.com/x2on/OpenSSL-for-iPhone) ([license](https://github.com/x2on/OpenSSL-for-iPhone/blob/master/LICENSE))
- [SecureEnclaveCrypto](https://github.com/trailofbits/SecureEnclaveCrypto) ([license](https://github.com/trailofbits/SecureEnclaveCrypto/blob/master/LICENSE))
- [Chromium](https://www.chromium.org/Home) ([license](https://cs.chromium.org/chromium/src/LICENSE))
