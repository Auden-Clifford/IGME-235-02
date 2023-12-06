class Player extends PIXI.Sprite {
    constructor(radius, color=0xFFFF00, x = 0, y = 0) {
        super();
        this.beginFill(color);
        this.drawCircle(0,0,radius);
        this.endFill();
        //super(app.loader.resources["images/spaceship.png"].texture);
        this.anchor.set(.5, .5); // position, scaling, rotating etc are now from center of sprite
        this.scale.set(0.1);
        this.x = x;
        this.y = y;
    }
}

class Zombie extends PIXI.Graphics{
    constructor(radius, color=0xFF0000, x=0, y=0){
        super();
        this.beginFill(color);
        this.drawCircle(0,0,radius);
        this.endFill();
        this.x = x;
        this.y = y;
        this.radius = radius;
        // variables
        this.fwd = getRandomUnitVector();
        this.speed = 50;
        this.isAlive = true;
    }

    move(dt=1/60){
        this.x += this.fwd.x * this.speed * dt;
        this.y += this.fwd.y * this.speed * dt;
    }

    reflectX(){
        this.fwd.x *= -1;
    }

    reflectY(){
        this.fwd.y *= -1;
    }
}

class Bullet extends PIXI.Graphics{
    constructor(color=0xFFFFFF, x=0, y=0){
        super();
        this.beginFill(color);
        this.drawRect(-2,-3,4,6);
        this.endFill();
        this.x = x;
        this.y = y;
        // variables
        this.fwd = {x:0,y:-1};
        this.speed = 400;
        this.isAlive = true;
        Object.seal(this);
    }

    move(dt=1/60)
    {
        this.x += this.fwd.x * this.speed * dt;
        this.y += this.fwd.y * this.speed * dt;
    }
}

// idea: objects like Player & zombie store class instances like PhysicsObject and Agent within them as properties, similar to component-based arcitecture
class PhysicsObject {
    constructor (posX=0, posY=0, radius, coefFriction){
        this.position = new Victor(posX,posY);
        this.velocity = new Victor(0,0);
        this.direction = new Victor(0,1);
        this.acceleration = new Victor(0,0);

        this.radius = radius;
        this.coefFriction = coefFriction;
    }

    /*
    * Gets this object's mass (equal to it's area)
    */
    getMass = function () {
        return Math.PI * Math.pow(radius, 2); 
    }

    /*
    * Gets this object's direction (equal to it's normalized velocity)
    */
    getDirection = function () {
        return velocity.clone().normalize();
    }

    /*
    * applies a force vector to this object's acceleration factoring in the object's mass
    */
    applyForce = function(force)
    {
        this.acceleration.add(force.divideScalar(this.getMass()));
    }

    /*
    * applies a force oposite to the object's velocity
    */
    applyFriction = function()
    {
        let friction = this.velocity.clone().invert();
        friction.normalize();
        friction.multiplySacalar(this.coefFriction);
        this.applyForce(friction);
    }

    /*
    * detects whether this object is intersecting another
    */
    detectIntersection(otherObject)
    {
        // ensure this object is not being checked against itself
        if(this !== otherObject)
        {
            return this.position.distance(otherObject.position) <= this.radius + otherObject.radius ? true : false
        }
    }
}