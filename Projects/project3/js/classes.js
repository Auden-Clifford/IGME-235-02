class Player extends PIXI.Graphics {
    constructor(x = 0, y = 0, radius=25, color=0xFFFF00) {
        super();
        this.physics = new PhysicsObject(x,y,radius,500,500);
        this.beginFill(color);
        this.drawCircle(0,0,radius);
        this.endFill();
        //super(app.loader.resources["images/spaceship.png"].texture);
        //this.anchor.set(.5, .5); // position, scaling, rotating etc are now from center of sprite
        //this.scale.set(0.1);

        this.x = this.physics.position.x;
        this.y = this.physics.position.y;

        //variables
        //this.alive = true;
        this.health = 100;
        this.maxHealth = 100;
        this.healthMultiplier = 1;
        this.speed = this.physics.maxSpeed;
        this.speed = 1;
        this.attackSpeed = 1;
        this.respawnTime = 3;

        // timers
        this.attackTimer = 1/this.attackSpeed;
        this.respawnTimer = this.respawnTime;
    }

    respawn(deltaTime)
    {
        // decrease this timer only while the function is called
        this.respawnTimer -= deltaTime;
        this.visible = false;

        respawnTimer.visible = true;
        respawnTimer.text = Math.trunc(this.respawnTimer);

        if(this.respawnTimer < 0)
        {
            this.health = this.maxHealth;
            this.physics.position.x = sceneWidth / 2;
            this.physics.position.y = sceneHeight - 200;
            this.respawnTimer = this.respawnTime;
        }
    }

    shoot(mousePosition)
    {
        if(currentState = GameState.Game)
        {
            if(this.attackTimer < 0)
            {
                let b = new Bullet(0xFFFFFF, this.physics.position.x, this.physics.position.y, mousePosition.subtract(this.physics.position).normalize());
                bullets.push(b);
                gameScene.addChild(b);

                // reset timer
                this.attackTimer = 1/this.attackSpeed;
            }
        }
    }

    update(vector, deltaTime=1/60)
    {
        // increment timers
        this.attackTimer -= deltaTime;

        // only allow movement/attack when player
        if(this.health > 0)
        {
            this.visible = true;
            respawnTimer.visible = false;

            // if a movement vector was submitted, update position
            if(vector.length() > 0)
            {
                let desiredVel = vector.normalize().multiplyScalar(this.physics.maxSpeed);
                let force = desiredVel.subtract(this.physics.velocity);
                this.physics.applyForce(force);
            }

            // allow physics to update
            this.physics.update(deltaTime);

            // set the player's position to match it's physics object
            this.x = this.physics.position.x;
            this.y = this.physics.position.y;
        }
        else
        {
            this.respawn(deltaTime);
        }
        
    }
}

class Zombie extends PIXI.Graphics{
    constructor(x=0, y=0, radius=25, color=0xFF0000, health=50, speed=250, damage=10, attackSpeed=1, separateRadius=150){
        super();
        // physics setup
        this.physics = new PhysicsObject(x,y,radius,speed,500);

        this.beginFill(color);
        this.drawCircle(0,0,this.physics.radius);
        this.endFill();
        this.x = this.physics.position.x;
        this.y = this.physics.position.y;
        //this.radius = radius;

        // variables
        this.isAlive = true;
        this.health = health;
        this.damage = damage;
        this.attackSpeed = attackSpeed;
        this.separateRadius = separateRadius;
        this.maxForce = 400;

        // timers
        this.attackTimer = 0;
    }

    /*
    * returns a force vector that seeks a target position
    */
    seek(targetPos) {
        let desiredVel = (targetPos.clone().subtract(this.physics.position)).normalize().multiplyScalar(this.physics.maxSpeed);
        return desiredVel.subtract(this.physics.velocity);
    }

    /*
    * returns a force vector that flees from a target position
    */
    flee(targetPos) {
        let desiredVel = (this.physics.position.clone().subtract(targetPos)).normalize().multiplyScalar(this.physics.maxSpeed);
        return desiredVel.subtract(this.physics.velocity);
    }

    /*
    * returns a force vector that separates this object from others
    */
    separate(otherObjects)
    {
        let sum = new Victor(0,0);
        let count = 0;

        for(let object of otherObjects)
        {
            //check for others within separation distance
            if(object !== this && this.physics.position.distance(object.physics.position) < this.separateRadius)
            {
                // add a flee force scaled by the distance between the objects
                sum.add(this.flee(object.physics.position).divideScalar(this.physics.position.distance(object.physics.position)))
                count++;
            }
        }

        // don't devide if there were zero other objets
        if(count > 0)
        {
            sum.divideScalar(count);
        }

        return sum;
    }

    attack(target)
    {
        if(this.attackTimer < 0)
        {
            target.health -= this.damage;
            this.attackTimer = 1/this.attackSpeed;
        }
    }

    update(target, zombies, deltaTime=1/60)
    {
        //incerment timers
        this.attackTimer -= deltaTime;

        // apply a seek force toward the given target
        let sum = new Victor(0,0);
        sum.add(this.seek(target.physics.position));
        sum.add(this.separate(zombies).multiplyScalar(50));
        this.physics.applyForce(sum);

        // allow physics to update
        this.physics.update(deltaTime);

        // set the player's position to match it's physics object
        this.x = this.physics.position.x;
        this.y = this.physics.position.y;
    }
}

class Bullet extends PIXI.Graphics{
    constructor(color=0xFFFFFF, x=0, y=0, fwd){
        super();
        this.beginFill(color);
        this.drawRect(-6,-6,6,6);
        this.endFill();
        this.vPosition = new Victor(x,y);

        this.x = this.vPosition.x;
        this.y = this.vPosition.y;

        // variables
        this.fwd = fwd;
        this.speed = 800;
        this.isAlive = true;
        Object.seal(this);
    }

    move(dt=1/60)
    {
        this.vPosition.add(this.fwd.clone().multiplyScalar(this.speed * dt));
        this.x = this.vPosition.x;
        this.y = this.vPosition.y;
        //console.log(this.position);
    }
}

// idea: objects like Player & zombie store class instances like PhysicsObject and Agent within them as properties, similar to component-based arcitecture
class PhysicsObject {
    constructor (posX=0, posY=0, radius, maxSpeed, coefFriction){
        this.position = new Victor(posX,posY);
        this.velocity = new Victor(0,0);
        this.direction = new Victor(0,1);
        this.acceleration = new Victor(0,0);

        this.radius = radius;
        this.maxSpeed = maxSpeed;
        this.coefFriction = coefFriction;
    }

    /*
    * Gets this object's mass (equal to 1/100 it's area)
    */
    getMass() {
        return Math.PI * Math.pow(this.radius / 100, 2); 
    }

    /*
    * Gets this object's direction (equal to it's normalized velocity)
    */
    getDirection() {
        return velocity.clone().normalize();
    }

    /*
    * applies a force vector to this object's acceleration factoring in the object's mass
    */
    applyForce(force)
    {
        this.acceleration.add(force.divideScalar(this.getMass()));
    }

    /*
    * applies a force oposite to the object's velocity
    */
    applyFriction()
    {
        let friction = this.velocity.clone().invert();
        friction.normalize();
        friction.multiplyScalar(this.coefFriction);
        // force of friction cannot exceed velocity
        if(friction.length() > this.velocity.length())
        {
            friction.normalize().multiplyScalar(this.velocity.length());
        }
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

    /*
    * Gets this object's position a given number of seconds in the future
    */
    getFuturePosition(time)
    {
        return this.position.clone().add(this.velocity.multiplySacalar(time));
    }

    update(deltaTime=1/60)
    {
        // apply a friction force
        this.applyFriction();

        // add acceleration to velocity
        this.velocity.add(this.acceleration.clone().multiplyScalar(deltaTime));

        // cap velocity at max
        if(this.velocity.length() > this.maxSpeed)
        {
            this.velocity.normalize().multiplyScalar(this.maxSpeed);
        }

        // calculate position
        this.position.add(this.velocity.clone().multiplyScalar(deltaTime));

        // reset acceleration
        this.acceleration.multiplyScalar(0);
    }
}