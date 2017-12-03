var app = require('http').createServer();
var io = require('socket.io')(app);
var jetpack = require('fs-jetpack');
var easystarjs = require('easystarjs');
var easystar = new easystarjs.js();

app.listen(2137);

var names = [
  "Andrzej",
  "Bartosz",
  "Arnold",
  "Henryk",
  "Zbigniew",
  "Artur",
  "Adrian",
  "Jarosław"
];

var player = function( id ){
  this.id = id;
  this.name = names[ Math.round(Math.random()*names.length) ];
  this.x = 0;
  this.y = 0;
  this.z = 0;
  this.path = [];
}

var players = [];

function getPlayerById( id ){
  for (var i = 0; i < players.length; i++) {
    if ( players[i].id === id ){
      return i;
    }
  }
  return false;
}

var map = [
  [
    jetpack.read("data/maps/map01.chunk"),
    jetpack.read("data/maps/map01.json", "json")
  ]
]

var grid = [];

for (var y = 0; y < 150; y++) {
  grid.push([]);
  for (var x = 0; x < 150; x++) {
    grid[y].push(0);
  }
}

for (var i = 0; i < map[0][1].length; i++) {
  if ( !map[0][1][i].passable ){
    grid[ map[0][1][i].position[1] ][ map[0][1][i].position[0] ] = 1;
  }
}

easystar.setDirectionalCondition(78, 74, [easystarjs.BOTTOM, easystarjs.RIGHT, easystarjs.LEFT]);
easystar.setDirectionalCondition(79, 74, [easystarjs.BOTTOM, easystarjs.RIGHT, easystarjs.LEFT]);
easystar.setDirectionalCondition(80, 74, [easystarjs.BOTTOM, easystarjs.RIGHT, easystarjs.LEFT]);

easystar.setDirectionalCondition(81, 73, [easystarjs.BOTTOM, easystarjs.TOP, easystarjs.RIGHT]);
easystar.setDirectionalCondition(81, 71, [easystarjs.BOTTOM, easystarjs.TOP, easystarjs.RIGHT]);

easystar.setDirectionalCondition(78, 70, [easystarjs.TOP, easystarjs.RIGHT, easystarjs.LEFT]);
easystar.setDirectionalCondition(79, 70, [easystarjs.TOP, easystarjs.RIGHT, easystarjs.LEFT]);
easystar.setDirectionalCondition(80, 70, [easystarjs.TOP, easystarjs.RIGHT, easystarjs.LEFT]);

easystar.setDirectionalCondition(77, 71, [easystarjs.BOTTOM, easystarjs.TOP, easystarjs.LEFT]);
easystar.setDirectionalCondition(77, 72, [easystarjs.BOTTOM, easystarjs.TOP, easystarjs.LEFT]);
easystar.setDirectionalCondition(77, 73, [easystarjs.BOTTOM, easystarjs.TOP, easystarjs.LEFT]);

easystar.setDirectionalCondition(78, 73, [easystarjs.TOP, easystarjs.RIGHT]);
easystar.setDirectionalCondition(79, 73, [easystarjs.TOP, easystarjs.RIGHT, easystarjs.LEFT]);
easystar.setDirectionalCondition(80, 73, [easystarjs.TOP, easystarjs.LEFT]);

easystar.setDirectionalCondition(78, 72, [easystarjs.BOTTOM, easystarjs.TOP, easystarjs.RIGHT]);

easystar.setDirectionalCondition(78, 71, [easystarjs.BOTTOM, easystarjs.RIGHT]);
easystar.setDirectionalCondition(79, 71, [easystarjs.BOTTOM, easystarjs.RIGHT, easystarjs.LEFT]);
easystar.setDirectionalCondition(80, 71, [easystarjs.BOTTOM, easystarjs.LEFT]);

easystar.setGrid(grid);
easystar.setAcceptableTiles([0]);

easystar.disableCornerCutting();
easystar.enableDiagonals();

io.on('connection', function (socket) {
  console.log( socket.id + "connected" );

  players.push( new player(socket.id) );

  var mapDataToSend = map[0];
  for (var i = 0; i < map[0][1].length; i++) {
    map[0][1][i].appearance = jetpack.read( "data/objects/"+map[0][1][i].name+".json", "json" ).appearance;
    map[0][1][i].passable = jetpack.read( "data/objects/"+map[0][1][i].name+".json", "json" ).passable;
  }

  socket.emit("map", map[0] );

  socket.on("disconnect", function(){
    players.splice( getPlayerById( socket.id ), 1 );

    io.emit("remove", socket.id);
  })

  // socket.on("askforobject", function( name ){
  //   io.emit("objectreturn", jetpack.read( "data/objects/"+name+".json" ));
  // })

  socket.on("click", function( pos ){
    var id = getPlayerById( socket.id );

    easystar.findPath(players[ id ].x+75, players[ id ].y+75, pos[0]+75, pos[1]+75, function( path ) {
      if (!path || path.length == 0) {
        // alert("Path was not found.");
        console.log("The player is standing on: " + (players[ id ].x+75) + ", " + (players[ id ].y+75));
        console.log("No path to this place.");
      } else {
        console.log("Path was found. The first Point is " + path[0].x + " " + path[0].y);
        console.log(path);
        players[ id ].path = path;
      }
    });

    easystar.calculate();

    // var grid = new pathfinding.Grid(150, 150);


    // for (var i = 0; i < map[0][1].length; i++) {
    // if ( !map[0][1][i].passable ){
    // grid.setWalkableAt(map[0][1][i].position[0], map[0][1][i].position[1], false);
    // }
    // }

    // var finder = new pathfinding.AStarFinder({
    //   allowDiagonal: true,
    //   dontCrossCorners: true
    // });
    // players[ id ].path = finder.findPath(players[ id ].x+75, players[ id ].y+75, pos[0]+75, pos[1]+75, grid);
  })

  socket.on("key", function(key){
    var id = getPlayerById( socket.id );
  })

});

function update(){

  for (var i = 0; i < players.length; i++) {
    if ( players[i].path.length > 1 ) {
      players[i].x = players[i].path[1].x-75;
      players[i].y = players[i].path[1].y-75;
      players[i].path.splice( 0, 1 );
    }
  }

  io.emit("update", { players: players });

  setTimeout(function () {
    update();
  }, 200);
}

update();
