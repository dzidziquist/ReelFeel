const { withXcodeProject, withEntitlementsPlist } = require('@expo/config-plugins')
const path = require('path')
const fs = require('fs')

const APP_GROUP = 'group.com.reelfeel.app'

const SWIFT_SOURCE = `import Foundation
import WidgetKit
import React

@objc(WidgetDataBridge)
class WidgetDataBridge: NSObject {
  private let appGroupID = "group.com.reelfeel.app"

  @objc func setData(
    _ json: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard let defaults = UserDefaults(suiteName: appGroupID) else {
      reject("NO_APP_GROUP", "App Group not configured", nil)
      return
    }
    defaults.set(json, forKey: "widgetData")
    defaults.synchronize()
    WidgetCenter.shared.reloadAllTimelines()
    resolve(nil)
  }

  @objc static func requiresMainQueueSetup() -> Bool { false }
}
`

const OBJC_SOURCE = `#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(WidgetDataBridge, NSObject)
RCT_EXTERN_METHOD(
  setData:(NSString *)json
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)
@end
`

const withAppGroup = (config) =>
  withEntitlementsPlist(config, (c) => {
    const key = 'com.apple.security.application-groups'
    const existing = c.modResults[key] ?? []
    if (!existing.includes(APP_GROUP)) {
      c.modResults[key] = [...existing, APP_GROUP]
    }
    return c
  })

const withNativeBridge = (config) =>
  withXcodeProject(config, (c) => {
    const xcodeProject = c.modResults
    const platformRoot = c.modRequest.platformProjectRoot
    const appName = c.modRequest.projectName ?? 'ReelFeel'
    const targetDir = path.join(platformRoot, appName)

    const files = [
      { name: 'WidgetDataBridge.swift', content: SWIFT_SOURCE },
      { name: 'WidgetDataBridge.m',     content: OBJC_SOURCE },
    ]

    const groupKey = xcodeProject.findPBXGroupKey({ name: appName })

    for (const file of files) {
      const dest = path.join(targetDir, file.name)
      if (!fs.existsSync(dest)) {
        fs.writeFileSync(dest, file.content, 'utf8')
      }
      const relativePath = `${appName}/${file.name}`
      const alreadyAdded = Object.values(xcodeProject.pbxFileReferenceSection() ?? {}).some(
        (ref) => ref && ref.path && ref.path.replace(/"/g, '') === file.name
      )
      if (!alreadyAdded && groupKey) {
        xcodeProject.addSourceFile(relativePath, {}, groupKey)
      }
    }

    return c
  })

module.exports = (config) => {
  config = withAppGroup(config)
  config = withNativeBridge(config)
  return config
}
