/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

// Wait for the deviceready event before using any of Cordova's device APIs.
// See https://cordova.apache.org/docs/en/latest/cordova/events/events.html#deviceready
//app.initialize();

document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
    // Cordova is now initialized. Have fun!

    console.log('Running cordova-' + cordova.platformId + '@' + cordova.version);
    document.getElementById('deviceready').classList.add('ready');

}

var logged = prompt("Please enter your name", "");
const { fromEvent } = rxjs;
const { map } = rxjs.operators;

var canvas = document.querySelector('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
var ctx = canvas.getContext('2d');

var clientData = {
    x: undefined,
    y: undefined,
    name: undefined,
    scrRt: undefined
}

clientData.name = logged;
clientData.scrRt = canvas.width / canvas.height;
//define a data structure to contain all the cycles
var cycleArrays = [];

//var socket = io.connect('http://192.168.1.179:2000');
var socket = io.connect('edcsystem.hopto.org:2000');
//var socket = io.connect('http://10.233.78.136:2000');


//track the window size changing and emit the ratio to backend
fromEvent(window, 'resize')
    .pipe(
        map((event) => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            clientData.scrRt = canvas.width / canvas.height;
            var str = JSON.stringify(clientData);
            return str;
        })
    )
    .subscribe((data) => {
        socket.emit('playerMove', data);
    });

//track the mouse over position and emit to backend
fromEvent(document, 'mousemove')
    .pipe(
        map((event) => {
            clientData.x = event.x / canvas.width;
            clientData.y = event.y / canvas.height;
            var str = JSON.stringify(clientData);
            return str;
        })
    )
    .subscribe((data) => {
        socket.emit('playerMove', data);
    });


//listen and accept the data stream
fromEvent(socket, 'server')
    .subscribe((data) => {
        if (data === 'IT wins') {
            alert('IT wins');

        } else if (data === 'OTHERs win') {
            alert('OTHERs win');
        } else {
            init(data);
            animate();
        }
    });


//Animate receving data every 20 ms
function animate() {
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    circleArray.forEach((a) => a.draw());
}

//Put the receiving data into array
function init(arrData) {
    circleArray = [];
    for (var i = 0; i < arrData.length; i++) {

        var x = arrData[i].xpos * canvas.width;
        var y = arrData[i].ypos * canvas.height;
        var radius = arrData[i].radius * canvas.width;
        var role = arrData[i].role;
        var name = arrData[i].name;
        var color;
        if (role === 'IT')
            color = 'green'
        else if (role === 'OTHER')
            color = 'red'
        else if (role === 'SPEEDUP')
            color = 'blue'
        else if (role === 'SCALAR')
            color = 'black'

        circleArray.push(new Circle(x, y, radius, color, name));
    }
}

 
//Define the class of player and power-up as circle
class Circle {
    constructor(x, y, radius, color, name) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.name = name;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.strokeStyle = this.color;
        ctx.stroke();
        ctx.font = "15px Georgia";
        ctx.fillText(this.name, this.x - 8, this.y + 8, 100);
    }
}