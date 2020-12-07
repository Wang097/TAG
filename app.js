let { fromEvent, interval } = require('rxjs');
let { map, takeUntil } = require('rxjs/operators');
let express = require('express');
let app = express();
let cors = require('cors');
app.use(cors());
let serv = require('http').Server(app);
let io = require('socket.io')(serv, {});
var allplayers;
var emitData = null;
const RA = 0.03;

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/www/index.html');

});

app.use(express.static(__dirname + '/www'));
serv.listen(2000, () => console.log('server started on port 2000'));

class Player {
    constructor(id, xpos, ypos, radius, speed, role, name, mx, my, scrRt) {
        this.id = id;
        this.xpos = xpos;
        this.ypos = ypos;
        this.radius = radius;
        this.speed = speed;
        this.role = role;
        this.name = name;
        this.mx = mx;
        this.my = my;
        this.scrRt = scrRt;
    }
}

begin();


//connectionObservable
fromEvent(io, 'connection')
    .subscribe(function(client) {

        //When new player arrives, push into allplayer array
        console.log(client.id + ' connected')
        init(client.id);

        //Receiving client observable, update the player in allplayer array
        fromEvent(client, 'playerMove')
            .pipe(
                map(x => JSON.parse(x))
            )
            .subscribe(data => {
                updatePlayerData(data, client.id);
            });

        //When disconnected, remove disconnected player from the array
        fromEvent(client, 'disconnect').subscribe(() => {
            removeFromAllPlayers(client.id);
            console.log(client.id + ' was disconnected');
        });


        //Emit data to client every 20ms
        interval(20)
            .pipe(
                takeUntil(fromEvent(client, 'disconnect'))
            )
            .subscribe(() => {
                updateEmitData(client.id);
                

                if (emitData === 'IT wins' || emitData === 'OTHERs win') {
                    console.log('Game over '+emitData);
                    //client.disconnect();
                    endAllConnects();
                }
                client.emit('server', emitData);
            });
    });

//When IT or OTHER wins, all sockets connection end
function endAllConnects() {
    var sockets = io.sockets.sockets;
    for (var socketId in sockets) {
        sockets[socketId].emit('server', emitData);
        sockets[socketId].disconnect();
    }
}


//update the emit data and call it every 20ms
function updateEmitData(id) {
    collide();
    eatPowerUp();
    if (checkGameOver() === 'IT wins') {
        emitData = 'IT wins';

    } else if (checkGameOver() === 'OTHERs win') {
        emitData = 'OTHERs win';
    } else {
        emitData = allplayers;
    }
    updatePos(id);
}

//When each round start will call here
function begin() {
    allplayers = [];
    init('speedup');
    init('scalar');
}

//When connecting, set a new player 
function init(id) {
    var newPlayer;

    if (id === 'speedup') {
        newPlayer = new Player(id, Math.random() * 0.8 + 0.1, Math.random() * 0.8 + 0.1, RA / 5, 0.0001, 'SPEEDUP', ' ', 0, 0);

    } else if (id === 'scalar') {
        newPlayer = new Player(id, Math.random() * 0.8 + 0.1, Math.random() * 0.8 + 0.1, RA / 3, 0.0001, 'SCALAR', ' ', 0, 0);

    } else {
        if (numRoles('IT') === 0) {
            newPlayer = new Player(id, Math.random(), Math.random(), RA, 0.0001, 'IT', undefined, 0, 0);
        } else {
            newPlayer = new Player(id, Math.random(), Math.random(), RA, 0.0001, 'OTHER', undefined, 0, 0);
        }

    }
    pushToAllPlayers(newPlayer);
}



//When connecting the socket, the new player would push into allPlayer array
function pushToAllPlayers(player) {

    for (var key in allplayers) {
        if (player.id === allplayers[key].id)
            return;
    }
    allplayers.push(player);
}


//Disconnect socket would lead remove the player from allPlayers array
function removeFromAllPlayers(ids) {

    allplayers.splice(allplayers.findIndex(item => item.id === ids), 1);
}


//update all players data depends on the client side sending data
//Mainly update the xpos and ypos
function updatePlayerData(result, id) {
    for (var key in allplayers) {
        if (id === allplayers[key].id) {
            allplayers[key].mx = result.x;
            allplayers[key].my = result.y;
            allplayers[key].name = result.name;
            allplayers[key].scrRt = result.scrRt;
        }
    }
}

//Renew the position of all player depends on mouse position 
function updatePos(id) {
    for (var key in allplayers) {
        if (id === allplayers[key].id) {
            var dx = Math.abs(allplayers[key].xpos - allplayers[key].mx);
            var dy = Math.abs(allplayers[key].ypos - allplayers[key].my);
            var dist = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));

            var xspeed = allplayers[key].speed * dx / dist;
            var yspeed = allplayers[key].speed * dy / dist;
            var yrad = allplayers[key].radius * allplayers[key].scrRt;


            if (allplayers[key].xpos < allplayers[key].mx) {
                allplayers[key].xpos = allplayers[key].xpos + xspeed * 20;
                if (allplayers[key].xpos > 1 - allplayers[key].radius) {
                    allplayers[key].xpos = 1 - allplayers[key].radius;
                }
            } else if (allplayers[key].xpos > allplayers[key].mx) {
                allplayers[key].xpos = allplayers[key].xpos - xspeed * 20;
                if (allplayers[key].xpos < allplayers[key].radius) {
                    allplayers[key].xpos = allplayers[key].radius;
                }
            }

            if (allplayers[key].ypos < allplayers[key].my) {
                allplayers[key].ypos = allplayers[key].ypos + yspeed * 20;
                if (allplayers[key].ypos > 1 - yrad) {
                    allplayers[key].ypos = 1 - yrad;
                }
            } else if (allplayers[key].ypos > allplayers[key].my) {
                allplayers[key].ypos = allplayers[key].ypos - yspeed * 20;
                if (allplayers[key].ypos < yrad) {
                    allplayers[key].ypos = yrad;
                }
            }
        }
    }
}


//check the collide between IT and OTHER
function collide() {
    for (var i in allplayers)
        for (var j in allplayers) {
            if ((allplayers[i].role === 'IT' || allplayers[i].role === 'OTHER') &&
                (allplayers[j].role === 'IT' || allplayers[j].role === 'OTHER')) {

                if (disCalculate(allplayers[i], allplayers[j]) <= allplayers[i].radius + allplayers[j].radius &&
                    allplayers[i].role !== allplayers[j].role) {
                    console.log(allplayers[i].id + ' ' + allplayers[j].id + ' collided');
                    allplayers[i].role = 'IT';
                    allplayers[i].role = 'IT';
                }
            }
        }
}

//Calculate the distance between two players
function disCalculate(player1, player2) {
    var dx = Math.abs(player1.xpos - player2.xpos);
    var dy = Math.abs(player1.ypos - player2.ypos);
    var dist = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
    return dist

}


//checking game over or not
function checkGameOver() {

    if (numRoles('IT') === allplayers.length - numRoles('SPEEDUP') - numRoles('SCALAR') && numRoles('IT') !== 1) {
        return 'IT wins';
    } else if (numRoles('OTHER') === allplayers.length - numRoles('SPEEDUP') - numRoles('SPEEDUP')) {
        return 'OTHERs win';
    }

}


//Count the role of no. players in allplayers
function numRoles(str) {
    var num = 0;
    for (var key in allplayers) {
        if (allplayers[key].role === str)
            num++;
    }
    return num;
}


//Check whether the power up was eaten by the player
function eatPowerUp() {
    for (var i in allplayers) {
        for (var j in allplayers) {
            if ((allplayers[i].role === 'SPEEDUP' || allplayers[j].role === 'SPEEDUP') && (i !== j) &&
                (disCalculate(allplayers[i], allplayers[j]) <= Math.abs(allplayers[i].radius - allplayers[j].radius))) {
                console.log('SPEEDUP power-up was eaten');

                if (allplayers[i].role === 'SPEEDUP') {
                    if (allplayers[j].role === 'IT') {
                        allplayers[j].speed = allplayers[j].speed * 1.1
                    } else {
                        allplayers[j].speed = allplayers[j].speed * 1.2
                    }
                } else {

                    if (allplayers[i].role === 'IT') {
                        allplayers[i].speed = allplayers[i].speed * 1.1
                    } else {
                        allplayers[i].speed = allplayers[i].speed * 1.2
                    }
                }

                removeFromAllPlayers('speedup');
                init('speedup');
            } else if ((allplayers[i].role === 'SCALAR' || allplayers[j].role === 'SCALAR') && (i !== j) &&
                (disCalculate(allplayers[i], allplayers[j]) <= Math.abs(allplayers[i].radius - allplayers[j].radius))) {
                console.log('SCALAR power-up was eaten');

                if (allplayers[i].role === 'SCALAR') {
                    if (allplayers[j].role === 'IT') {
                        allplayers[j].radius = allplayers[j].radius * 1.2
                    } else {
                        allplayers[j].radius = allplayers[j].radius * 0.8
                    }
                } else {

                    if (allplayers[i].role === 'IT') {
                        allplayers[i].radius = allplayers[i].radius * 1.2
                    } else {
                        allplayers[i].radius = allplayers[i].radius * 0.8
                    }
                }

                removeFromAllPlayers('scalar');
                init('scalar');
            }
        }
    }
}