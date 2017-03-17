var poly;
var surfaces = [];

function setup() {
  createCanvas(640,480);
  
  poly = new Poly(80);

  for (var i = 0; i < 100; i++) {
    surfaces.push(new Surface(createVector(random(width), random(height)), createVector(random(width), random(height))));
  }
}

function update(){
  poly.update();
}

function draw() {
  update();

  background(50,89,100);

  stroke(255,255,255,30);
  strokeWeight(1);
  var rayNumber = 500;

  for (var i = 0; i < rayNumber; i++) {
    ray(createVector(mouseX, mouseY), direction((i + 1) / rayNumber));
  }

  surfaces.forEach(function(s) {
    s.draw(createVector(0, 0));
  })

  poly.draw();
}

function Surface(p1,p2){
  this.p1 = p1;
  this.p2 = p2;

  this.getCollisionDistance = function(c, start, dir){
    var x1 = c.x + p1.x;
    var y1 = c.y + p1.y;
    var x2 = c.x + p2.x;
    var y2 = c.y + p2.y;
      
    var dx = x2 - x1;
    var dy = y2 - y1;
    var denum = (dy - dir.y/dir.x * dx)
    if (denum === 0){
      return;
    }
    var t = (start.y - y1 + dir.y/dir.x * (x1 - start.x)) / denum;
    var p = (x1 + dx * t - start.x) / dir.x
    
    if (p >= 0 && t >= 0 && t <= 1) {
      return p;
    } else {
      return Infinity;
    }
  }

  this.draw = function (c){ 
    stroke(0);
    line(c.x + p1.x, c.y + p1.y, c.x + p2.x, c.y + p2.y);
  }
    
}

function Poly(n){
  this.surfaces = [];
  this.sprouts = [];
  this.r = 100;
  this.c = new p5.Vector(random(width),random(height));
  var a = 2*PI/(n-1);
  var offset= random(PI)
  
  for(var i = 0; i < n-1; i ++){
    var angle = i*a + offset;
    var x1 = cos(angle)*this.r;
    var y1 = sin(angle)*this.r;
    var angle2 = (i + 1) * a + offset;
    var x2 = cos(angle2) * this.r;
    var y2 = sin(angle2) * this.r;
    
    this.surfaces.push(new Surface(createVector(x1,y1),createVector(x2,y2)));
  }
  
  for(var i= 0; i < n-1; i ++){
    var p1 = this.surfaces[i].p1;
    var p2 = this.surfaces[i].p2;
    var p3 = this.surfaces[(i+1)%(n-1)].p2;

    var v1 = p5.Vector.sub(p2, p1);
    var v2 = p5.Vector.sub(p2, p3);
    var va = p5.Vector.add(v1, v2);
    va.div(2);
    va.normalize();
    var root = p2;
    var dir = va;
    var sprout = new Sprout(root, dir);
    this.sprouts.push(sprout);
  }    
  
  this.update = function(){
    for(var i=0; i < this.sprouts.length; i++){
      this.sprouts[i].update(this.c);
    }
  }
  
  this.draw = function() {
    noStroke();
    this.surfaces.forEach(function (surface) {
      surface.draw(this.c);
    }.bind(this));

    this.sprouts.forEach(function (sprout) {
      sprout.draw(this.c);
    }.bind(this))
  }
}

function Sprout(root, dir){
  this.root = root;
  this.dir = dir;
  this.energy = 0;
  this.burn = 0;
  this.burnt = false;
  this.fruits = [];
  
  this.getTip = function(){
    return createVector(
      this.root.x + this.dir.x * this.energy,
      this.root.y + this.dir.y * this.energy
    )
  }
  
  this.update = function(c){
    var tip = this.getTip();
    var d = max(10, dist(c.x + root.x, c.y + root.y, mouseX, mouseY));
    var force = 100 / (d * d);
    this.energy += force;
    var maxEnergy = 50;
    if (this.energy > maxEnergy ){
      this.energy = maxEnergy;
    }
    
    this.burn += force;
    
    this.burn *= 0.99;
    this.energy *= 0.999;
    
    if (this.burn > 50) {
      this.burnt = true;
    }
    
    if (this.fruits.length < 5 && this.energy > maxEnergy * 0.7 && random(0, 1) < 0.01) {
      this.fruits.push(new Fruit(this,c));
    }
    
    for (var i = 0; i < this.fruits.length; i++) {
      this.fruits[i].update(c);
    }
  }
  
  this.draw = function(c) {
    if (this.burnt) {
      stroke(0);
      fill(0);
      ellipse(c.x + this.root.x, c.y + this.root.y, 3, 3);
      return;
    }
    var health = this.burn / 50;
    var tip = this.getTip();
    stroke(255 * health, 230 * (1 - health), 0);
    line(
      c.x + this.root.x,
      c.y + this.root.y,
      c.x + tip.x,
      c.y + tip.y    
      );
    for (var i = 0; i < this.fruits.length; i++) {
      this.fruits[i].draw();
    }
  }

}

function Fruit(sprout,c){
  var sproutTip = sprout.getTip();
  this.sprout = sprout;
  this.pos = sproutTip;
  this.pos.add(c);
  this.vel = createVector(0, 1);
  this.offset = createVector(random(-10,10),random(-10,10));
  
  this.update = function(c) {
    if (!this.sprout.burnt) {
      var tip = this.sprout.getTip(c);
      tip.add(c);
      tip.add(this.offset);
      tip.sub(this.pos);
      var d = tip.mag();
      var max_r = 2;
      
      tip.normalize();
      tip.mult((max_r - d) * -0.01);
      this.vel.add(tip);
    }
    this.vel.mult(0.8);
    this.pos.add(this.vel);
  }
  
  this.draw = function() {
    noStroke();
    ellipse(this.pos.x, this.pos.y, 4, 4);
  }
}


function ray(start, dir){
  var earliestCollision = Infinity;

  for (var i = 0; i < poly.surfaces.length; i++) {
    var surface = poly.surfaces[i];
    var d = surface.getCollisionDistance(poly.c,start,dir);
    if(earliestCollision > d){
      earliestCollision = d;
    }
  }

  for (var i = 0; i < surfaces.length; i++) {
    var surface = surfaces[i];
    var d = surface.getCollisionDistance(createVector(0, 0), start, dir);
    if(earliestCollision > d){
      earliestCollision = d;
    }
  }
  
  
  if (earliestCollision === Infinity) {
    earliestCollision = max(width, height);
  }
  line(start.x, start.y, start.x + dir.x * earliestCollision, start.y + dir.y * earliestCollision);
}

function direction(i){
  var n = noise(i * 20, millis() * 0.00001);
  var angle = n * 5 * PI;
  var x = cos(angle);
  var y = sin(angle);
  return createVector(x,y);
}
