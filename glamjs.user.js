// ==UserScript==
// @name         Eorzea Collection to Glamourer
// @namespace    GlamJS
// @icon         https://www.google.com/s2/favicons?domain_url=https://store.finalfantasyxiv.com/ffxivstore/en-gb/
// @version      0.1.0
// @description  Exports glamour designs from Eorzea Collection ready to be imported into Glamourer.
// @author       aza
// @match        https://ffxiv.eorzeacollection.com/glamour/*
// @require      https://cdn.jsdelivr.net/npm/pako/dist/pako.min.js
// @grant        GM_setClipboard
// @license      Apache-2.0
// @homepageURL  https://github.com/azaerina/glamjs
// @supportURL   https://github.com/azaerina/glamjs/issues
// @updateURL    https://raw.githubusercontent.com/azaerina/glamjs/master/glamjs.meta.js
// @downloadURL  https://raw.githubusercontent.com/azaerina/glamjs/master/glamjs.user.js
// ==/UserScript==

(function() {
    'use strict';

    const GlamourerConverter = (function (env) {
        // Cache key to cache XIVAPI ID lookups
        const CACHE_KEY = 'glamjs_xivapi_cache';

        // Cache accessor
        let memCache = null;

        // Glamour version
        const VERSION = 6;

        // Dye map with names and IDs
        const dyeMap = {
            'Undyed': 0, 'Snow White': 1, 'Ash Grey': 2, 'Goobbue Grey': 3, 'Slate Grey': 4, 'Charcoal Grey': 5, 'Soot Black': 6,
            'Rose Pink': 7, 'Lilac Purple': 8, 'Rolanberry Red': 9, 'Dalamud Red': 10, 'Rust Red': 11, 'Wine Red': 12, 'Coral Pink': 13, 'Blood Red': 14,
            'Salmon Pink': 15, 'Sunset Orange': 16, 'Mesa Red': 17, 'Bark Brown': 18, 'Chocolate Brown': 19, 'Russet Brown': 20, 'Kobold Brown': 21,
            'Cork Brown': 22, 'Qiqirn Brown': 23, 'Opo-opo Brown': 24, 'Aldgoat Brown': 25, 'Pumpkin Orange': 26, 'Acorn Brown': 27, 'Orchard Brown': 28,
            'Chestnut Brown': 29, 'Gobbiebag Brown': 30, 'Shale Brown': 31, 'Mole Brown': 32, 'Loam Brown': 33, 'Bone White': 34, 'Ul Brown': 35,
            'Desert Yellow': 36, 'Honey Yellow': 37, 'Millioncorn Yellow': 38, 'Coeurl Yellow': 39, 'Cream Yellow': 40, 'Halatali Yellow': 41,
            'Raisin Brown': 42, 'Mud Green': 43, 'Sylph Green': 44, 'Lime Green': 45, 'Moss Green': 46, 'Meadow Green': 47, 'Olive Green': 48,
            'Marsh Green': 49, 'Apple Green': 50, 'Cactuar Green': 51, 'Hunter Green': 52, 'Ochu Green': 53, 'Adamantoise Green': 54, 'Nophica Green': 55,
            'Deepwood Green': 56, 'Celeste Green': 57, 'Turquoise Green': 58, 'Morbol Green': 59, 'Ice Blue': 60, 'Sky Blue': 61, 'Seafog Blue': 62,
            'Peacock Blue': 63, 'Rhotano Blue': 64, 'Corpse Blue': 65, 'Ceruleum Blue': 66, 'Woad Blue': 67, 'Ink Blue': 68, 'Raptor Blue': 69,
            'Othard Blue': 70, 'Storm Blue': 71, 'Void Blue': 72, 'Royal Blue': 73, 'Midnight Blue': 74, 'Shadow Blue': 75, 'Abyssal Blue': 76,
            'Lavender Purple': 77, 'Gloom Purple': 78, 'Currant Purple': 79, 'Iris Purple': 80, 'Grape Purple': 81, 'Lotus Pink': 82, 'Colibri Pink': 83,
            'Plum Purple': 84, 'Regal Purple': 85, 'Ruby Red': 86, 'Cherry Pink': 87, 'Canary Yellow': 88, 'Vanilla Yellow': 89, 'Dragoon Blue': 90,
            'Turquoise Blue': 91, 'Gunmetal Black': 92, 'Pearl White': 93, 'Metallic Brass': 94, 'Carmine Red': 95, 'Neon Pink': 96, 'Bright Orange': 97,
            'Neon Yellow': 98, 'Neon Green': 99, 'Azure Blue': 100, 'Pure White': 101, 'Jet Black': 102, 'Pastel Pink': 103, 'Dark Red': 104,
            'Dark Brown': 105, 'Pastel Green': 106, 'Dark Green': 107, 'Pastel Blue': 108, 'Dark Blue': 109, 'Pastel Purple': 110, 'Dark Purple': 111,
            'Metallic Silver': 112, 'Metallic Gold': 113, 'Metallic Red': 114, 'Metallic Orange': 115, 'Metallic Yellow': 116, 'Metallic Green': 117,
            'Metallic Sky Blue': 118, 'Metallic Blue': 119, 'Metallic Purple': 120, 'Violet Purple': 121, 'Metallic Pink': 122, 'Metallic Ruby Red': 123,
            'Metallic Cobalt Green': 124, 'Metallic Dark Blue': 125
        };

        // Slots map
        const slotMap = { 'HEAD': 'Head', 'BODY': 'Body', 'HANDS': 'Hands', 'LEGS': 'Legs', 'FEET': 'Feet', 'WEAPON': 'MainHand', 'OFFHAND': 'OffHand', 'EARRINGS': 'Ears', 'NECKLACE': 'Neck', 'BRACELETS': 'Wrists', 'RING': 'LFinger' };

        // Base empty default design
        var EMPTY_DESIGN = {
            "version": 6,
            "data": {
                "FileVersion": 2,
                "Identifier": null,
                "CreationDate": new Date().toISOString(),
                "LastEdit": new Date().toISOString(),
                "Name": "EC Export",
                "Description": "",
                "ForcedRedraw": false,
                "ResetAdvancedDyes": 0,
                "ResetTemporarySettings": false,
                "RevertAdvancedDyes": 0,
                "Color": "",
                "QuickDesign": true,
                "Tags": [],
                "WriteProtected": false,
                "Equipment": {
                    "MainHand": { "ItemId": 1601, "Crest": false, "Apply": false, "ApplyStain": true, "ApplyCrest": false, "Stain": 0, "Stain2": 0 },
                    "OffHand": { "ItemId": 4294966874, "Crest": false, "Apply": false, "ApplyStain": true, "ApplyCrest": true, "Stain": 0, "Stain2": 0 },
                    "Head": { "ItemId": 4294967164, "Crest": false, "Apply": false, "ApplyStain": true, "ApplyCrest": true, "Stain": 0, "Stain2": 0 },
                    "Body": { "ItemId": 4294967163, "Crest": false, "Apply": false, "ApplyStain": true, "ApplyCrest": true, "Stain": 0, "Stain2": 0 },
                    "Hands": { "ItemId": 4294967162, "Crest": false, "Apply": false, "ApplyStain": true, "ApplyCrest": false, "Stain": 0, "Stain2": 0 },
                    "Legs": { "ItemId": 4294967160, "Crest": false, "Apply": false, "ApplyStain": true, "ApplyCrest": false, "Stain": 0, "Stain2": 0 },
                    "Feet": { "ItemId": 4294967159, "Crest": false, "Apply": false, "ApplyStain": true, "ApplyCrest": false, "Stain": 0, "Stain2": 0 },
                    "Ears": { "ItemId": 4294967158, "Crest": false, "Apply": false, "ApplyStain": true, "ApplyCrest": false, "Stain": 0, "Stain2": 0 },
                    "Neck": { "ItemId": 4294967157, "Crest": false, "Apply": false, "ApplyStain": true, "ApplyCrest": false, "Stain": 0, "Stain2": 0 },
                    "Wrists": { "ItemId": 4294967156, "Crest": false, "Apply": false, "ApplyStain": true, "ApplyCrest": false, "Stain": 0, "Stain2": 0 },
                    "RFinger": { "ItemId": 4294967155, "Crest": false, "Apply": false, "ApplyStain": true, "ApplyCrest": false, "Stain": 0, "Stain2": 0 },
                    "LFinger": { "ItemId": 4294967155, "Crest": false, "Apply": false, "ApplyStain": true, "ApplyCrest": false, "Stain": 0, "Stain2": 0 },
                    "Hat": { "Show": true, "Apply": true },
                    "VieraEars": { "Show": true, "Apply": true },
                    "Visor": { "IsToggled": false, "Apply": true },
                    "Weapon": { "Show": false, "Apply": true }
                },
                "Bonus": { "Glasses": { "BonusId": 0, "Apply": false } },
                "Customize": {
                    "ModelId": 0,
                    "Race": { "Value": 1, "Apply": false },
                    "Gender": { "Value": 0, "Apply": false },
                    "BodyType": { "Value": 1, "Apply": false },
                    "Height": { "Value": 50, "Apply": false },
                    "Clan": { "Value": 1, "Apply": false },
                    "Face": { "Value": 1, "Apply": false },
                    "Hairstyle": { "Value": 1, "Apply": false },
                    "Highlights": { "Value": 0, "Apply": false },
                    "SkinColor": { "Value": 1, "Apply": false },
                    "EyeColorRight": { "Value": 1, "Apply": false },
                    "HairColor": { "Value": 0, "Apply": false },
                    "HighlightsColor": { "Value": 1, "Apply": false },
                    "FacialFeature1": { "Value": 0, "Apply": false },
                    "FacialFeature2": { "Value": 0, "Apply": false },
                    "FacialFeature3": { "Value": 0, "Apply": false },
                    "FacialFeature4": { "Value": 0, "Apply": false },
                    "FacialFeature5": { "Value": 0, "Apply": false },
                    "FacialFeature6": { "Value": 0, "Apply": false },
                    "FacialFeature7": { "Value": 0, "Apply": false },
                    "LegacyTattoo": { "Value": 0, "Apply": false },
                    "TattooColor": { "Value": 1, "Apply": false },
                    "Eyebrows": { "Value": 1, "Apply": false },
                    "EyeColorLeft": { "Value": 1, "Apply": false },
                    "EyeShape": { "Value": 1, "Apply": false },
                    "SmallIris": { "Value": 0, "Apply": false },
                    "Nose": { "Value": 1, "Apply": false },
                    "Jaw": { "Value": 1, "Apply": false },
                    "Mouth": { "Value": 1, "Apply": false },
                    "Lipstick": { "Value": 0, "Apply": false },
                    "LipColor": { "Value": 1, "Apply": false },
                    "MuscleMass": { "Value": 50, "Apply": false },
                    "TailShape": { "Value": 1, "Apply": false },
                    "BustSize": { "Value": 50, "Apply": false },
                    "FacePaint": { "Value": 1, "Apply": false },
                    "FacePaintReversed": { "Value": 0, "Apply": false },
                    "FacePaintColor": { "Value": 1, "Apply": false },
                    "Wetness": { "Value": false, "Apply": false }
                },
                "Parameters": {
                    "FacePaintUvMultiplier": { "Value": 0, "Apply": false },
                    "FacePaintUvOffset": { "Value": 0, "Apply": false },
                    "MuscleTone": { "Percentage": 0, "Apply": false },
                    "LeftLimbalIntensity": { "Percentage": 0, "Apply": false },
                    "RightLimbalIntensity": { "Percentage": 0, "Apply": false },
                    "SkinDiffuse": { "Red": 0, "Green": 0, "Blue": 0, "Apply": false },
                    "HairDiffuse": { "Red": 0, "Green": 0, "Blue": 0, "Apply": false },
                    "HairHighlight": { "Red": 0, "Green": 0, "Blue": 0, "Apply": false },
                    "LeftEye": { "Red": 0, "Green": 0, "Blue": 0, "Apply": false },
                    "RightEye": { "Red": 0, "Green": 0, "Blue": 0, "Apply": false },
                    "FeatureColor": { "Red": 0, "Green": 0, "Blue": 0, "Apply": false },
                    "LipDiffuse": { "Red": 0, "Green": 0, "Blue": 0, "Alpha": 0, "Apply": false },
                    "DecalColor": { "Red": 0, "Green": 0, "Blue": 0, "Alpha": 0, "Apply": false }
                },
                "Materials": {}, "Mods": [], "Links": { "Before": [], "After": [] }
            }
        };

        function compressWithVersion(jsonString, version) {
            var header = [0x1f, 0x8b, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
            var utf8b = new TextEncoder().encode(jsonString);
            var payload2 = pako.deflateRaw(utf8b, { level: 9, flush: 2 });
            var result2 = new Uint8Array(1 + header.length + payload2.length);
            
            result2[0] = version;
            result2.set(header, 1);
            result2.set(payload2, 1 + header.length);

            return result2;
        }

        function bytesToBase64(bytes) {
            return btoa(Array.from(bytes, b => String.fromCharCode(b)).join(''));
        }

        function toBase64(jObject) {
            var data = (jObject && jObject.data) ? jObject.data : jObject;
            var version = (jObject && jObject.version && typeof jObject.version === 'number') ? jObject.version : VERSION;
            var cleanData = JSON.parse(JSON.stringify(data));

            if (cleanData.version !== undefined && cleanData.Version === undefined) {
                cleanData.Version = cleanData.version;
                delete cleanData.version;
            }

            if (cleanData.Version === undefined) cleanData.Version = version;

            return bytesToBase64(compressWithVersion(JSON.stringify(cleanData), version));
        }

        function getCache() {
            if (memCache) return memCache;

            try {
                memCache = JSON.parse(localStorage.getItem(CACHE_KEY)) || {};
            } catch (e) {
                memCache = {};
            }

            return memCache;
        }

        async function fetchIdFromXIVAPI(itemName) {
            if (!itemName || itemName === "None") return 0;

            const cache = getCache();
            const cacheKey = `xivapi:${itemName.toLowerCase()}`;
            if (cache[cacheKey]) return cache[cacheKey];

            try {
                const url = `https://v2.xivapi.com/api/search?sheets=Item&fields=Name&query=Name="${encodeURIComponent(itemName)}"`;
                const response = await fetch(url);
                const data = await response.json();
                const match = data.results.find(r => r.fields.Name.toLowerCase() === itemName.toLowerCase());
                const id = match ? match.row_id : 0;

                console.debug(`[GlamJS] Fetched ${itemName} => ID ${id} from XIVAPI`);

                if (id !== 0) { cache[cacheKey] = id; localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); }

                return id;
            } catch (e) {
                console.warn(`[GlamJS] Skipped ${itemName}:`, e);

                return 0;
            }
        }

        async function fromEorzeaCollection(root) {
            var design = JSON.parse(JSON.stringify(EMPTY_DESIGN));
            design.data.Identifier = crypto.randomUUID();

            var equipment = design.data.Equipment;
            var ringCount = 0;
            var items = root.querySelectorAll('.list.box');

            const promises = Array.from(items).map(async (row) => {
                var slotLabel = row.querySelector('.gear-icon-box-slot-name');
                if (!slotLabel) return null;

                var rawSlot = slotLabel.textContent.trim().toUpperCase();
                var targetSlot = slotMap[rawSlot];
                if (rawSlot === 'RING') { targetSlot = (ringCount === 0) ? 'LFinger' : 'RFinger'; ringCount++; }
                if (!targetSlot) return null;

                var idAnchor = row.querySelector('.list-item-title .eorzeadb_link');
                var itemName = idAnchor ? idAnchor.textContent.trim() : "";

                var xivId = await fetchIdFromXIVAPI(itemName);

                var dyeTags = row.querySelectorAll('.list-item-description .tag');
                var stains = [0, 0];
                var dyeIdx = 0;

                dyeTags.forEach(function(tag) {
                    var txt = tag.textContent.trim();
                    if ((txt.includes('◯') || txt.includes('⬤')) && dyeIdx < 2) {
                        var dyeName = txt.replace(/[◯⬤]/g, '').trim();
                        stains[dyeIdx] = dyeMap[dyeName] || 0;
                        dyeIdx++;
                    }
                });

                return { targetSlot, itemId: xivId, stains };
            });

            const results = await Promise.all(promises);
            results.forEach(res => {
                if (res && equipment[res.targetSlot]) {
                    equipment[res.targetSlot].ItemId = res.itemId || equipment[res.targetSlot].ItemId;
                    equipment[res.targetSlot].Stain = res.stains[0];
                    equipment[res.targetSlot].Stain2 = res.stains[1];
                    equipment[res.targetSlot].Apply = true;
                    equipment[res.targetSlot].ApplyStain = true;
                }
            });

            return design;
        }

        return { toBase64: toBase64, fromEorzeaCollection: fromEorzeaCollection };
    })();

    function createCopyButton() {
        if (document.getElementById('glamourer-copy-btn')) return;

        const btn = document.createElement('button');
        btn.id = 'glamourer-copy-btn';
        btn.className = 'button is-primary is-rounded';

        btn.style.backgroundColor = '#fb4b4e';
        btn.style.color = 'white';
        btn.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
        btn.style.fontWeight = 'bold';
        btn.style.border = 'none';
        btn.style.padding = '0.75rem 1.5rem';
        btn.style.transition = 'transform 0.2s ease';

        btn.innerHTML = `
            <span class="icon"><i class="fas fa-clipboard"></i></span>
            <span>Copy to Glamourer</span>
        `;

        btn.onmouseenter = () => { btn.style.transform = 'scale(1.05)'; };
        btn.onmouseleave = () => { btn.style.transform = 'scale(1)'; };

        btn.onclick = async function() {
            try {
                const design = await GlamourerConverter.fromEorzeaCollection(document);
                console.debug('[GlamJS] Extracted design from Eorzea Collection:', design);

                const titleEl = document.querySelector('h1.title');
                if (titleEl) design.data.Name = titleEl.textContent.trim();

                const b64 = GlamourerConverter.toBase64(design);
                console.debug('[GlamJS] Converted design to Base64:', b64);

                GM_setClipboard(b64);

                const originalLabel = btn.querySelector('span:last-child').textContent;
                btn.querySelector('span:last-child').textContent = 'Copied to Clipboard!';
                btn.classList.replace('is-primary', 'is-success');

                setTimeout(() => {
                    btn.querySelector('span:last-child').textContent = originalLabel;
                    btn.classList.replace('is-success', 'is-primary');
                    btn.style.backgroundColor = '#fb4b4e';
                }, 2000);

            } catch (err) {
                console.error('[GlamJS] Error:', err);
                alert('Failed to convert outfit: ' + err.message);
            }
        };

        const container = document.querySelector('#js-app > div > div.section.container.pt-2.pb-0');
        if (container) {
            const columns = document.createElement('div');
            columns.className = 'columns';

            const column = document.createElement('div');
            column.className = 'column';

            const div = document.createElement('div');
            div.className = 'is-flex is-align-items-center is-justify-content-center';

            div.appendChild(btn);
            column.appendChild(div);
            columns.appendChild(column);
            container.appendChild(columns);

            return;
        }

        // If there's no container for whatever reason, we just add it as fixed to the bottom right of the screen
        btn.style.position = 'fixed';
        btn.style.bottom = '2rem';
        btn.style.right = '2rem';
        btn.style.zIndex = '99999';

        document.body.appendChild(btn);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createCopyButton);
    } else {
        createCopyButton();
    }

})();