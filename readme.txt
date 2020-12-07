Server Side:
Server side code in app.js
Server listen port number on 2000
Server start: node app.js



Client Side:
Client side code in www/js/index.js
Client connect url: edcsystem.hopto.org:2000

Android build: cordova build android
Android running on emulator: cordova emulate android

IOS build: cordova build ios
IOS running on emulator: cordova emulate ios



Note:
PLAYER:
IT: Green Circle, Radius: RA, first connected user)
OTHER: Red Circle, Radius: RA, Not first user, collide with IT will become IT)
IT chases OTHER, OTHER avoids IT. IT collides OTHER, OTHER becomes IT

POWER-UP(can be eaten by player when totally covering)
SPEEDUP: Blue Circle, Radius: RA/5, IT's speed*1.1 and OTHER's speed*1.2 after eating SPEEDUP.
SCALAR: Black Circle, Radius: RA/3, IT's radius*1.2 and OTHER's radius*0.8 after eating SCALAR.
Players(IT and OTHER) covers POWER-UP, POWER-UP is eaten and generate a new POWER-UP.



Game over: 
1. All players become IT(more than one player), IT wins.
2. All players are OTHER(all IT disconnected with server), OTHER wins.

