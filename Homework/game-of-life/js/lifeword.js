"use strict"

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
        // row and column must be greater than 0, otherwise return 0
        if(row <= 0 || col <= 0)
        {
            return 0;
        }

        // row and column must be less than the length of row/column arrays -1, otherwise return 0
        if(row >= this.numRows - 1 || col >= this.numCols - 1)
        {
            return 0;
        }

        // count living neighbors (N,NE,E,SE,S,SW,W,SW)
        let sum = 0;

        sum += this.world[row - 1][col - 1];
        sum += this.world[row - 1][col];
        sum += this.world[row -1][col + 1];

        sum += this.world[row][col - 1];
        sum += this.world[row][col + 1];

        sum += this.world[row + 1][col - 1];
        sum += this.world[row + 1][col];
        sum += this.world[row + 1][col + 1];
        
        // return the sum of living neighbors
        return sum;
    },

    step() {
        // determine the fate of each cell by calling getLivingNeighbors on each
        for(let row = 0; row < this.numRows; row++){
            for(let col = 0; col < this.numRows; col++){
                if(this.world[row][col] == 0)
                {
                    // logic for dead cells

                    // 3 live neighbors = life!
                    if(this.getLivingNeighbors(row,col) == 3)
                    {
                        this.worldBuffer[row][col] = 1;
                    }
                }
                else
                {
                    // logic for live cells

                    // < 2 live neighbors = death
                    if(this.getLivingNeighbors(row,col) < 2)
                    {
                        this.worldBuffer[row][col] = 0;
                    }
                    // > 3 live neighbors = death
                    else if(this.getLivingNeighbors(row,col) > 3)
                    {
                        this.worldBuffer[row][col] = 0;
                    }
                    // cells with 2 or 3 living neighbors live
                    else
                    {
                        this.worldBuffer[row][col] = 1;
                    }
                }
                
            }
        }

        this.world = this.worldBuffer;
        this.worldBuffer = this.buildArray();
    }
}