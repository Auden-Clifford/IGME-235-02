const lifeworld = {
    init(numCols, numRows){
        this.numCols = numCols,
        this.numRows = numRows,
        this.world = this.buildArray();
        this.worldBuffer = this.buildArray();
        this.randomSetup();
    },

    buildArray() {
        let outerArray = [];
        for(let row = 0; row < this.numRows; row++) {
            let innerArray = [];
            for(let col = 0; col < this.numCols; col++) {
                innerArray.push(0);
            }
            outerArray.push(innerArray);
        }
        return outerArray;
    },

    randomSetup() {
        for(let row = 0; row < this.numRows; row++) {
            for(let col = 0; col < this.numCols; col++)
            {
                this.world[row][col] = 0;
                if(Math.random() < .1){
                    this.world[row][col] = 1;
                }
            }
        }
    },

    getLivingNeighbors(row,col){

    },

    step() {
        this.randomSetup();
    }
}