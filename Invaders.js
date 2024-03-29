
function ports() {
	var OUT_PORT2 = 0;
	var OUT_PORT3 = 0;
	var OUT_PORT4LO = 0;
	var OUT_PORT4HI = 0;
	var OUT_PORT5 = 0;
	var IN_PORT1 = 0;
	var IN_PORT2 = 0;
	var a = enableAudio();
	
	this.init = function() {
            IN_PORT2 = (0x1 | 0x2);
            IN_PORT2 = (0x80);		
	}
	
	this.read1 = function() {
		return  IN_PORT1;
	}
	
	this.read2 = function() {
		return IN_PORT2;
	}
	
	this.write2 = function(value) {
		OUT_PORT2 = value;
	}
	
	this.read3 = function() {
		return ((((OUT_PORT4HI << 8) | OUT_PORT4LO) << OUT_PORT2) >> 8);
	}
	
	this.write3 = function(value) {
		if( (value & 0x02) && !(OUT_PORT3 & 0x02) )
			a.playShot();
		
		if( (value & 0x04) && !(OUT_PORT3 & 0x04) )
			a.playBaseHit();
		
		if( (value & 0x08) && !(OUT_PORT3 & 0x08) )
			a.playInvHit();
		
		OUT_PORT3 = value;
	}
	
	this.write4 = function(value) {
		OUT_PORT4LO = OUT_PORT4HI;
		OUT_PORT4HI = value;
	}
	
	this.write5 = function(value) {
		if( (value & 0x01) && !(OUT_PORT3 & 0x01) )
			a.playWalk1();
		
		if( (value & 0x02) && !(OUT_PORT3 & 0x02) )
			a.playWalk2();
		
		if( (value & 0x04) && !(OUT_PORT3 & 0x04) )
			a.playWalk3();
		
		if( (value & 0x08) && !(OUT_PORT3 & 0x08) )
			a.playWalk4();
		
		OUT_PORT5 = value;
	}
	
	this.coin = function(down) {
		if(down)
			IN_PORT1 |= 0x01;
		else
			IN_PORT1 &= ~0x01;
	}
	
	this.multiPlayer = function(down) {
		if(down)
			IN_PORT1 |= 0x02;
		else
			IN_PORT1 &= ~0x02;
	}
	
	this.singlePlayer = function(down) {
		if(down)
			IN_PORT1 |= 0x04;
		else
			IN_PORT1 &= ~0x04;
	}
	
	this.leftButton = function(down) {
		if(down)
		{
			IN_PORT1 |= 0x20;
			IN_PORT2 |= 0x20;
		}
		else
		{
			IN_PORT1 &= ~0x20;
			IN_PORT2 &= ~0x20;
		}
	}
	
	this.rightButton = function(down) {
		if(down)
		{
			IN_PORT1 |= 0x40;
			IN_PORT2 |= 0x40;
		}
		else
		{
			IN_PORT1 &= ~0x40;
			IN_PORT2 &= ~0x40;
		}
	}
	
	this.fire = function(down) {
		if(down)
		{
			IN_PORT1 |= 0x10;
			IN_PORT2 |= 0x10;
		}
		else
		{
			IN_PORT1 &= ~0x10;
			IN_PORT2 &= ~0x10;
		}
	}
}

function attachPorts(cpu) {
	var io = new ports();
	io.init();
	
	cpu.attachPort( 1, io.read1.bind(io) );
	cpu.attachPort( 2, io.read2.bind(io), io.write2.bind(io) );
	cpu.attachPort( 3, io.read3.bind(io), io.write3.bind(io) );
	cpu.attachPort( 4, undefined, io.write4.bind(io) );
	cpu.attachPort( 5, undefined, io.write5.bind(io) );
	return io;
}

function rst( n ) {
	return (0xc7|(n<<3));
}		

var cpu = cpu8080.create( 65536 );
var screen,io;
var go = false;
var alt_interrupt = 0;
var timer,timer2, timer3;

function coin() {
	io.coin(true);
	this.setTimeout( io.coin.bind(io,false), 10 );
}

function Player1() {
	io.singlePlayer(true);
	this.setTimeout( io.singlePlayer.bind(io,false), 10 );
}

function Player2() {
	io.multiPlayer(true);
	this.setTimeout( io.multiPlayer.bind(io,false), 10 );
}

function onLoad() {
	var code = invadersRom ;		
	cpu.load(0, code);
	io = attachPorts(cpu);
	var canvas = document.getElementById("SCREEN");
	ctx = canvas.getContext("2d");
	screen = new video.Screen(cpu, ctx,  canvas.width, canvas.height, false, 0);
	screen.setBackground( document.getElementById("BGCOLOR").value);
	screen.setForeground( document.getElementById("FGCOLOR").value);
	screen.clear();
	var onKeyDown = function(e) {
		switch(e.keyCode)
		{
			case 67:
				io.coin(true);break;
			case 50:
				io.multiPlayer(true);break;
			case 49:
				io.singlePlayer(true);break;
			case 37:
			case 65:
				io.leftButton(true);break;
			case 39:
			case 68:
				io.rightButton(true);break;
			case 32:
				io.fire(true);break;
		}
	}

	var onKeyUp = function(e) {
		switch(e.keyCode)
		{
			case 67:
				io.coin(false);break;
			case 50:
				io.multiPlayer(false);break;
			case 49:
				io.singlePlayer(false);break;
			case 37:
				io.leftButton(false);break;
			case 39:
				io.rightButton(false);break;
			case 32:
				io.fire(false);break;
		}
	}
	
	this.document.addEventListener("keydown", onKeyDown, false);
	this.document.addEventListener("keyup", onKeyUp, false);
	canvas.addEventListener("keydown", onKeyDown, false);
	canvas.addEventListener("", onKeyUp, false);
	
	toggle();
}

function processInterrupts() {
	if( cpu.IF )
	{
		if( alt_interrupt == 0)
		{
			cpu.interrupt(rst(1));
		}
		else
		{
			cpu.interrupt(rst(2));
		}
		alt_interrupt = 1-alt_interrupt;
	}
	
}

function run() {
	try
	{
		cpu.run(2000);
		timer = setTimeout(run, 4);
	}
	catch ( e )
	{
		clearInterval(timer2);
		clearInterval(timer3);
		alert( e.message );
	}
}

function render() {
	screen.setBackground( document.getElementById("BGCOLOR").value);
	screen.setForeground( document.getElementById("FGCOLOR").value);
	screen.render();
}

function reset() {
	if( go )
		toggle();

	cpu.reset();
	screen.clear();
	cpu.load(0, invadersRom);
	io.init();
}

function toggle() {
	go = go ? false : true;
	var b = document.getElementById("RUN");
	if( go )
	{
		screen.setBackground( document.getElementById("BGCOLOR").value);
		screen.setForeground( document.getElementById("FGCOLOR").value);
		screen.clear();
		
		step = 0;
		b.value = "stop...";
		timer = setTimeout(run, 4);
		timer2 = setInterval(render, 16);
		timer3 = setInterval(processInterrupts, 4 );
	}
	else
	{
		b.value = "run...";
		clearInterval(timer3);
		clearInterval(timer);
	}
}
