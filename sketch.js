var poly;

function setup() {
  createCanvas(640,480);
  
  poly = new Poly(80);
}

function update(){
  poly.update();
}

function draw() {
  update();
  background(50,89,100);
  stroke(255,255,255,30);
  strokeWeight(1);
  for (var i = 0; i < 100; i++) {
    ray(createVector(mouseX, mouseY), direction(i / 100));
  }
  poly.draw();
  
}

function Poly(n){
  this.points = [];
  this.sprouts = [];
  this.r = 100;
  this.c = new p5.Vector(random(width),random(height));
  var a = 2*PI/n;
  var offset= random(PI)
  
  for(var i = 0; i < n; i ++){
    var angle = i*a + offset;
    var x = cos(angle)*this.r;
    var y = sin(angle)*this.r;
    this.points.push(
      new p5.Vector(x,y)
    );
  }
  
  for(var i= 0; i < n; i ++){
    if (random(1) < 0.5) {
      continue;
    }
    var p1 = this.points[i];
    var p2 = this.points[(i+1)%n];
    var p3 = this.points[(i+2)%n];

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
  
  this.draw = function(){
    noStroke();
    for(var i= 0; i < n; i ++){
      line(
        this.c.x + this.points[i].x, 
        this.c.y + this.points[i].y, 
        this.c.x + this.points[(i+1)%n].x, 
        this.c.y + this.points[(i+1)%n].y
      );
    }
    this.sprouts.forEach(function (s) {
      s.draw(this.c);
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
  var earliestCollision = undefined;
  for(var i= 0; i < poly.points.length; i ++){
    var x1 = poly.c.x + poly.points[i].x;
    var y1 = poly.c.y + poly.points[i].y;
    var x2 = poly.c.x + poly.points[(i+1)%poly.points.length].x;
    var y2 = poly.c.y + poly.points[(i+1)%poly.points.length].y;
      
    var dx = x2 - x1;
    var dy = y2 - y1;
    var denum = (dy - dir.y/dir.x * dx)
    if (denum === 0){
      return;
    }
    var t = (start.y - y1 + dir.y/dir.x * (x1 - start.x)) / denum;
    var p = (x1 + dx * t - start.x) / dir.x
    
    if (p >= 0 && t >= 0 && t <= 1) {
      if (earliestCollision === undefined || p < earliestCollision) {
        earliestCollision = p;
      }
    }
  }
  
  if (earliestCollision === undefined) {
    earliestCollision = max(width, height);
  }
  line(start.x, start.y, start.x + dir.x * earliestCollision, start.y + dir.y * earliestCollision);
}

function direction(i){
  var n = noise(i * 20, millis() * 0.00001);
  var angle = n * 5 * PI + millis() * 0.0001;
  var x = cos(angle);
  var y = sin(angle);
  return createVector(x,y);
}
