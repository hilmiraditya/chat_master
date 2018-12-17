var appPort = 8000;
var express = require('express'), app = express();
var http = require('http')
  , server = http.createServer(app)
  , io = require('socket.io').listen(server);
var MagicCrypt = require('magiccrypt');
var jade = require('jade');
var pseudoArray = ['admin'];

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.use(express.static(__dirname + '/public'));
app.get('/', function(req, res){
  res.render('home.ejs');
});
server.listen(appPort);
console.log("Server listening on port " + appPort);

var users = 0;
io.sockets.on('connection', function (socket) {
	users += 1;
	reloadUsers();
	socket.on('message', function (data) {
		if(pseudoSet(socket)){
			let r = Math.random().toString(36).substring(7);
			var mc = new MagicCrypt(r, 256);
			var hasil_encrypt = mc.encrypt(data);
			var transmit_encrypt = { pseudo : socket.nickname, message : hasil_encrypt, key : true, key_des : r};
			socket.broadcast.emit('message', transmit_encrypt);

			var mc = new MagicCrypt(r, 256);
			var hasil_decrypt = mc.decrypt(hasil_encrypt);
			var transmit_decrypt = { pseudo : socket.nickname, message : hasil_decrypt, key : false, key_des: r};
			socket.broadcast.emit('message', transmit_decrypt);
			console.log("user "+ transmit_encrypt['pseudo'] +" pesan asli : \""+data+"\"" + " di encrypt menjadi : " + hasil_encrypt);
		}
	});
	socket.on('setPseudo', function (data) {
		if (pseudoArray.indexOf(data) == -1){
			pseudoArray.push(data);
			socket.nickname = data;
			socket.emit('pseudoStatus', 'ok');
			console.log("user " + data + " tersambung");
		}
		else{
			socket.emit('pseudoStatus', 'error')
		}
	});
	socket.on('disconnect', function () {
		users -= 1;
		reloadUsers();
		if (pseudoSet(socket)){
			console.log("disconnect...");
			var pseudo;
			pseudo = socket.nickname;
			var index = pseudoArray.indexOf(pseudo);
			pseudo.slice(index - 1, 1);
		}
	});
});
function reloadUsers(){
	io.sockets.emit('nbUsers', {"nb": users});
}
function pseudoSet(socket){
	var test;
	if (socket.nickname == null ) test = false;
	else test = true;
	return test;
}
