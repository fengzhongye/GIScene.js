/**
 * A Grid is defined by an origin and a tile size and provides functions to get indices, boundingBoxes etc.
 * 
 * @namespace GIScene
 * @class Grid
 * @constructor
 * @param {Object} config
 *  
 */

GIScene.Grid = function (config) {
	
	//Layer properties
	var defaults = {
		origin: new GIScene.Coordinate2(0,0) , //new THREE.Vector2(0,0),
		// tileSize:16,
		tileSizes : [16],
		sceneOffset: new GIScene.Coordinate3()
	};
	
	this.config = GIScene.Utils.mergeObjects(defaults, config || {});
	
	this.origin = this.config.origin; //.setY(-this.config.origin.y); //substract offset?
	// this.tileSize = this.config.tileSize;
	this.tileSizes = this.config.tileSizes;
	this.sceneOffset = this.config.sceneOffset;
	
	this._sceneOffset = this.sceneOffset.toVector3(); 
	this._origin = this.origin.toVector2().clone().sub(GIScene.Utils.vector3ToVector2(this._sceneOffset));
		
	
};

/**
 * An object representing a tile in the grid.
 * The x property indexes the tiles from west to east.
 * The y property indexes the tiles from south to north.
 * 
 * @namespace GIScene
 * @class Grid.Index
 * @constructor
 * @param {Integer} x
 * @param {Integer} y
 * @param {Number} tileSize
 */

GIScene.Grid.Index = function(x,y,tileSize) {
	this.x = x;
	this.y = y;
	this.tileSize = tileSize;
};

GIScene.Grid.Index.prototype = {
	//constructor : GIScene.Grid.Index,
	equals		: function(gridIndex) {
						return this.x == gridIndex.x && this.y == gridIndex.y && this.tileSize == gridIndex.tileSize;
				},
	toString	: function() {return this.x+"_"+this.y+"_"+this.tileSize;},
	fromString	: function(gridIndexString) {
						var tokens = gridIndexString.split("_");
						this.x = tokens[0];
						this.y = tokens[1];
						this.tileSize = tokens[2];
						return this;
				},
	getChildNW	: function() {
						var x = this.x * 2;
						var y = this.y * 2 + 1;
						return new GIScene.Grid.Index(x,y,this.tileSize * 0.5 );
				},
	getChildSW	: function() {
						var x = this.x * 2;
						var y = this.y * 2;
						return new GIScene.Grid.Index(x,y,this.tileSize * 0.5 );
				},
	getChildNE	: function() {
						var x = this.x * 2 + 1;
						var y = this.y * 2 + 1;
						return new GIScene.Grid.Index(x,y,this.tileSize * 0.5 );
				},
	getChildSE	: function() {
						var x = this.x * 2 + 1;
						var y = this.y * 2;
						return new GIScene.Grid.Index(x,y,this.tileSize * 0.5 );
				}
};

GIScene.Grid.GridLine = function (start, end) { //GIScene.Grid.Index
			  //check for same tileSize
			  if(start.tileSize != end.tileSize){
			  	alert("GIScene.Grid.GridLine(): start and end tiles have different tileSizes. They must have equal ones!");
			  }
			  this.start = start;
			  this.end   = end;
			};
			
GIScene.Grid.IndexStore = function() {
	this.store = []; //stores stringified GIScene.Grid.Index values
	
	// Index or Array of Index
	this.add = function(indexArray){
		indexArray = ( indexArray instanceof Array )? indexArray : [indexArray];
	    //indexArray.forEach(function (e,i,a){this.store[e.toString()]={index:e};}.bind(this));
	    indexArray.forEach(function(e,i,a){a[i]=a[i].toString();});
	    this.store = this.store.concat(indexArray);
	};

	// Index or Array of Index
	this.remove = function(indexArray){
		indexArray = ( indexArray instanceof Array )? indexArray : [indexArray];
		//indexArray.forEach(function(e,i,a){ delete this.store[e.toString()]; }.bind(this));
		indexArray.forEach(function(e,i,a){a[i] = a[i].toString();});
		var lengthBefore = this.store.length;
		this.store = this.store.filter(function(e,i,a){return( indexArray.indexOf(e) == -1 );});
		if(lengthBefore == this.store.length){return false;}else {return true;}
	};
	
};

GIScene.Grid.TileStore = function(config) {
	var defaults = {
					maxLength:1 //null
					// deleteMaterials: false,
					// deleteTextures: false
					};
	this.config = GIScene.Utils.mergeObjects(defaults, config || {});
	
	this.maxLength = this.config.maxLength;
	// this.deleteMaterials = this.config.deleteMaterials;
	// this.deleteTextures  = this.config.deleteTextures;
	
	this.store = {}; //stores stringified GIScene.Grid.Index values with a reference to a THREE.Object3D
	this.indexStore = new GIScene.Grid.IndexStore();
	this.length = 0;
	var ageCounter = 0;
	// Index or Array of Index
	this.add = function(gridIndex, tileObject){
			
		if(this.maxLength && this.length > this.maxLength){this.removeOldestEntry();}
		
		// console.log("GIScene.Grid.TileStore.length: "+this.length);
		// tileArray = ( tileArray instanceof Array )? tileArray : [tileArray];
	    // tileArray.forEach(function (e,i,a){this.store[e.toString()]={index:e};}.bind(this));
	    // tileArray.forEach(function(e,i,a){a[i]=a[i].toString();});
	    // this.store = this.store.concat(tileArray);
	    if(gridIndex instanceof GIScene.Grid.Index){
	    	this.store[gridIndex.toString()] = {object : tileObject, age:ageCounter++}; 
	    	this.indexStore.add(gridIndex);
	    	this.length++;
	    }else{
	    	console.log("GIScene.Grid.TileStore: First argument is not of type GIScene.Grid.Index");
		// this.length++;
		}
	};

	// Index or Array of Index
	this.remove = function(gridIndex){
		if(this.store[gridIndex.toString()]){
			
			delete this.store[gridIndex.toString()].object;
			delete this.store[gridIndex.toString()].age;
			delete this.store[gridIndex.toString()];
			
			this.indexStore.remove(gridIndex);
			
			this.length--;
			return true;
		}
		else return false;
		
	};
	
	this.getTile = function  (gridIndex) {
		var gridIndexString = gridIndex.toString();
		return (gridIndexString in this.store)? this.store[gridIndexString].object : false;
	};
	
	this.removeOldestEntry = function() {
		var oldest={age:Number.MAX_VALUE};
		var oldestKey;
		for(tile in this.store){
			if(this.store[tile].age < oldest.age){oldest = this.store[tile]; oldestKey = tile;};
		}
		console.log("oldestKey: "+oldestKey);
		
			
			
			//dispose object and it geometry but leave material and textures in case that they are used by multiple objects
			var object = this.store[oldestKey].object;
			// if(object.geometry){
				// object.geometry.dispose();
				// delete object.geometry;
			// }
			// var object = null;
			(object.material && object.material.isShared === false )? //isShared is defined e.g. in OverrideMaterialHandler/WMS.js
				GIScene.Utils.disposeObject(object,true, true, true, true) :  
				GIScene.Utils.disposeObject(object,true, false, false, true)
				;
			
			delete this.store[oldestKey].object;
			delete this.store[oldestKey].age;
			delete this.store[oldestKey];
			this.length--;
	};
};


GIScene.Grid.prototype = {
	
	constructor : GIScene.Grid,
	
	// getIndexFromPoint2d : function ( vector2 ) {
	getIndexFromPoint2d : function ( vector2, tileSize ) {
		
		return new GIScene.Grid.Index( 
			  // Math.floor( vector2.x / this.tileSize ) - Math.floor( this._origin.x / this.tileSize ),
			  Math.floor( vector2.x / tileSize ) - Math.floor( this._origin.x / tileSize ), 
			  //y needs to be negative because z goes negative to north. (0,0) is now in the lower left corner of the grid
			  // -(Math.ceil( vector2.y / this.tileSize ) - Math.floor( this._origin.y / this.tileSize )),
			  -(Math.ceil( vector2.y / tileSize ) - Math.floor( this._origin.y / tileSize )),
			  // (Math.ceil( -vector2.y / this.tileSize ) - Math.floor( -this.origin.y / this.tileSize )),
			  // this.tileSize  
			  tileSize
			  );	
	},
	
	//returns decimal gridcoords with tile center as full numbers
	getGridCoordFromPoint2d :function (vector2, tileSize) { //vector2 in graphics order (x: W->E, y:N->S[neg. value grows to the north]) and sceneoffset subtracted
	  
		return new THREE.Vector2(
			( vector2.x / tileSize ) - ( this._origin.x / tileSize ) - ( 0.5 ),
			-( ( vector2.y / tileSize ) - ( this._origin.y / tileSize )  ) - ( 0.5 )
		);
	  
	},
	
	getCentroidFromIndex: function(index) {
		var x = index.x*index.tileSize + this._origin.x/*index.tileSize*/ + index.tileSize/2;
		var y = -index.y*index.tileSize + this._origin.y/*index.tileSize*/ - index.tileSize/2; 
		// var y = -index.y*index.tileSize + this.origin.y/*index.tileSize*/ - index.tileSize/2; 
		return new THREE.Vector2(x,y);
	},
	
	getBoundingBoxFromIndex: function(index) {
		var centroid2 = this.getCentroidFromIndex(index);//v2
		var halfSize = index.tileSize/2;
		var bbox = {
			left:	centroid2.x - halfSize,
			right:  centroid2.x + halfSize,
			top:	centroid2.y - halfSize,
			bottom:	centroid2.y + halfSize
		};
		return bbox;
	},
	
	getCornerCoordsFromIndex: function(index) {
		var bbox = this.getBoundingBoxFromIndex(index);
		var cornerCoords = [
					{x: bbox.left, y: bbox.bottom}, //sw
					{x: bbox.right, y: bbox.bottom},//se
					{x: bbox.right, y: bbox.top}, //ne
					{x: bbox.left, y: bbox.top} //nw
					]; 
		return cornerCoords;
	},
	
	isDescendantOf: function(descendant, ancestor) { //both GIScene.Grid.Index
		if(!descendant || !ancestor)return false;
		var tileSizeLevelDistance = this.tileSizes.indexOf(descendant.tileSize) - this.tileSizes.indexOf(ancestor.tileSize);
		var levelFactor = tileSizeLevelDistance *2;
		var xAncestorLevel = Math.floor(descendant.x / levelFactor);
		var yAncestorLevel = Math.floor(descendant.y / levelFactor);
		return (xAncestorLevel == ancestor.x && yAncestorLevel == ancestor.y);	//isDescendant ? 
	},
	
	traverseIf_old: function(node, traverseCriteria, callback) {
		if(traverseCriteria(node)){
			if(node.tileSize <= this.tileSizes[0]){ //is leaf
				
				callback(node);
			}
			else {
				this.traverseIf(node.getChildNW(),traverseCriteria, callback);
				this.traverseIf(node.getChildNE(),traverseCriteria, callback);
				this.traverseIf(node.getChildSW(),traverseCriteria, callback);
				this.traverseIf(node.getChildSE(),traverseCriteria, callback);
			}
		}
	},
	
	traverseIf: function(node, traverseCriteria, isLeafNode, callback) {
		if (traverseCriteria(node)){ //is overlapping clipped view port polygon
			if (isLeafNode(node)){
				callback(node);
			} else {
				this.traverseIf(node.getChildNW(),traverseCriteria, isLeafNode, callback);
				this.traverseIf(node.getChildNE(),traverseCriteria, isLeafNode, callback);
				this.traverseIf(node.getChildSW(),traverseCriteria, isLeafNode, callback);
				this.traverseIf(node.getChildSE(),traverseCriteria, isLeafNode, callback);
			}
		}
		
	},
	
	//Bresenham Line
	getTilesFromGridLine : function (gridLine) {
		var tileSize = gridLine.start.tileSize;
	    var tiles = [];
	    // Translate coordinates
	    var x1 = gridLine.start.x; //startCoordinates.left;
	    var y1 = gridLine.start.y; //startCoordinates.top;
	    var x2 = gridLine.end.x;   //endCoordinates.left;
	    var y2 = gridLine.end.y;   //endCoordinates.top;
	    // Define differences and error check
	    var dx = Math.abs(x2 - x1);
	    var dy = Math.abs(y2 - y1);
	    var sx = (x1 < x2) ? 1 : -1;
	    var sy = (y1 < y2) ? 1 : -1;
	    
	    //8-connectedLine Bresenham
	    if(false){
	    var err = dx - dy;
	    // Set first coordinates
	    tiles.push(new GIScene.Grid.Index(x1, y1, tileSize));
	    // Main loop
	    while (!((x1 == x2) && (y1 == y2))) {
	      var e2 = err << 1;
	      if (e2 > -dy) {
	        err -= dy;
	        x1 += sx;
	      }
	      if (e2 < dx) { 
	        err += dx;
	        y1 += sy;
	      }
	      // Set coordinates
	      tiles.push(new GIScene.Grid.Index(x1, y1, tileSize));
	      }
	    }
	    
	      //4-connected line (see http://stackoverflow.com/questions/5186939/algorithm-for-drawing-a-4-connected-line) 
	      var e = 0;
		  for (var i=0; i < dx+dy; i++) {
		      tiles.push(new GIScene.Grid.Index(x1, y1, tileSize));
		      var e1 = e + dy;
		      var e2 = e - dx;
		      if (Math.abs(e1) < Math.abs(e2)) {
		          x1 += sx;
		          e = e1;
		      } else {
		          y1 += sy;
		          e = e2;
		      }
		  }
		  // draw reverse
		  var e = 0;
		  for (var i=0; i < dx+dy; i++) {
		      tiles.push(new GIScene.Grid.Index(x1, y1, tileSize));
		      var e1 = e + dy;
		      var e2 = e - dx;
		      if (Math.abs(e1) < Math.abs(e2)) {
		          x1 += -sx;
		          e = e1;
		      } else {
		          y1 += -sy;
		          e = e2;
		      }
		  }
		  //if start and endpoint are equal return one tile
		  if(dx+dy == 0){
		  	tiles.push(new GIScene.Grid.Index(x1, y1, tileSize));
		  }
	      
	      
	   
	    // Return the result
	    return tiles;
	 },
	 
	 
	 /**
	  * Returns an array of Grid.Index objects which are intersected by a line
	  * 
	  * @method getTilesFromLineIntersection
	  * @param {GIScene.Coordinate2} startCoord2 
	  * @param {GIScene.Coordinate2} endCoord2
	  * @param {Number} tileSize
	  * @return {Array of GIScene.Grid.Index} tiles
	  */
	 getTilesFromLineIntersection : function(startCoord2, endCoord2, tileSize) { //GIScene.Coordinate2
	 //	ctx.rasterLine4 = function(x1o,y1o,x2o,y2o, color, scale) {
		
		var tiles = [];
		var startV2_ = startCoord2.toVector2().clone().sub(GIScene.Utils.vector3ToVector2(this._sceneOffset));
		var endV2_ 	 =   endCoord2.toVector2().clone().sub(GIScene.Utils.vector3ToVector2(this._sceneOffset));
		
		//convert world into grid coord system
		var startGridCoord = this.getGridCoordFromPoint2d( startV2_, tileSize );
		var endGridCoord   = this.getGridCoordFromPoint2d(   endV2_, tileSize );
		
		var x1o = startGridCoord.x;
		var y1o = startGridCoord.y;
		var x2o = endGridCoord.x;
		var y2o = endGridCoord.y;
		
		//original slope (m)
	    var dxo = (x2o - x1o);  
	    var dyo = (y2o - y1o);  
		var   m = dyo/dxo;
		//@TODO horizontal and vertical lines (m==0 bzw. m == Infinity)
		var horizontal = ( dyo == 0 );
		var vertical   = ( dxo == 0 );
		
		//step direction
	    var sx = (x1o < x2o) ? 1 : -1; //step x (positive: line goes from left to right)
	    var sy = (y1o < y2o) ? 1 : -1; //step y (positive: line goes from top to bottom)
	    
	    //const
	    var m_sx = m*sx;
	    var m_sy = (1/m)*sy;
	    
	    //number of steps to draw 
	    var lx1 = Math.abs(Math.round(x2o)-Math.round(x1o)); //in x direction
	    var ly1 = Math.abs(Math.round(y2o)-Math.round(y1o)); //in y direction
	    
	    //start values
	    var x1o_round = Math.round(x1o);
	    var y1o_round = Math.round(y1o);
	    var _delta_x = x1o - x1o_round;
	    var _delta_y = y1o - y1o_round;
	    var x_step = x1o - _delta_y * (1/m);   
	    var y_step  = y1o - _delta_x * m;
	    
	    //end values
	    var x2o_round = Math.round(x2o);
	    var y2o_round = Math.round(y2o);
	    
	    //tile coordinates
	    var _x,_y;
		
		//if slope <= 1 do x steps
	    if( Math.abs(m) <= 1 && !horizontal){
	    	
	    	//1st to penultimate point
	    	for ( var i = 0; i < lx1; i++ ){
	    		 _x = x1o_round + i*sx;
		    	 _y = (y_step + i*m_sx);    	
		    	
		    	var x_round = Math.round(_x);
		    	var y_round = (i!=0)? Math.round(_y) : y1o_round; //draw first point where it is, all others with y according to middle of tile
		    	
		    	// ctx.drawPoint(x_round,y_round,color,scale);
		    	tiles.push(new GIScene.Grid.Index(x_round,y_round,tileSize));
		    	
		    	//need for filling point?
		    	var change = (Math.round(y_step + (i+1)*m_sx) - y_round);// != 0);
		    	if(i == lx1-1){
		    		//last change
		    		change = y2o_round - y_round; // != 0;
		    	}
		    	if(change != 0){
		    		//fill left or right
		    		
		    		var y_cutNext = (y_step + (m_sx*(i+0.5)));
		    		var left_side = Math.round(y_cutNext) == y_round;
		    		//if passing exactly in the middle draw both for touching is true
		    		//be tolerant to floating point errors
		    		var both = ((Math.floor((Math.abs(y_cutNext)%1) * 10000))/10000 == 0.5); 
		    		
	    			if(left_side || both){
		    			
		    			// ctx.drawPoint(x_round+sx,y_round,"green",scale);	
		    			tiles.push(new GIScene.Grid.Index(x_round+sx,y_round,tileSize));	
		    		}
		    		
		    		if(!left_side || both){
		    			
		    			// ctx.drawPoint(x_round,y_round+sy,"blue",scale);
		    			tiles.push(new GIScene.Grid.Index(x_round,y_round+sy,tileSize));
		    		}
		    		
		    		if( Math.abs(change) > 1){
		    			
		    			// ctx.drawPoint(x_round+sx,y_round+sy,"aqua",scale);
		    			tiles.push(new GIScene.Grid.Index(x_round+sx,y_round+sy,tileSize));
		    		
		    		}
		    		
		    	}
		    } //end for
		    
		    // lastpoint 
		    // ctx.drawPoint(Math.round(x2o),Math.round(y2o),"yellow",scale);
		    tiles.push(new GIScene.Grid.Index(Math.round(x2o),Math.round(y2o),tileSize));
	   } 
	
		//if slope > 1 do y steps
	    if( Math.abs(m) > 1 && !vertical){
	    		    	
	    //1st to penultimate point
	    	for ( var i = 0; i < ly1; i++ ){
	    		 _y = y1o_round + i*sy;
		    	 _x = (x_step + i*m_sy);    	
		    	
		    	var y_round = Math.round(_y);
		    	var x_round = (i!=0)? Math.round(_x) : x1o_round; //draw first point where it is, all others with y according to middle of tile
		    	
		    	// ctx.drawPoint(x_round,y_round,color,scale);
		    	tiles.push(new GIScene.Grid.Index(x_round,y_round,tileSize));
		    	
		    	//need for filling point
		    	var change = (Math.round(x_step + (i+1)*m_sy) - x_round );//!= 0); 0:no change; 1 or 2?
		    	if(i == ly1-1){
		    		//last change
		    		change = x2o_round - x_round;// != 0;
		    	}
		    	if(change !=0 ){
		    		//fill left or right
		    		
		    		var x_cutNext = (x_step + (m_sy*(i+0.5)));
		    		var left_side = Math.round(x_cutNext) == x_round;
		    		//if passing exactly in the middle draw both for touching is true
		    		//be tolerant to floating point errors
		    		var both = ((Math.floor((Math.abs(x_cutNext)%1) * 10000))/10000 == 0.5);
		    		 
	    			if(!left_side || both){
		    			
		    			// ctx.drawPoint(x_round+sx,y_round,"green",scale);
		    			tiles.push(new GIScene.Grid.Index(x_round+sx,y_round,tileSize));	
		    			
		    		}
		    		
		    		if(left_side || both){
		    			
		    			// ctx.drawPoint(x_round,y_round+sy,"blue",scale);
		    			tiles.push(new GIScene.Grid.Index(x_round,y_round+sy,tileSize));
		    		}
		    		
		    		if( Math.abs(change) > 1){
		    			
		    			// ctx.drawPoint(x_round+sx,y_round+sy,"aqua",scale);
		    			tiles.push(new GIScene.Grid.Index(x_round+sx,y_round+sy,tileSize));
		    		
		    		}
		    	}
		    } //end for
		    
		    //lastpoint
		     // ctx.drawPoint(x2o_round,y2o_round,"yellow",scale);
		     tiles.push(new GIScene.Grid.Index(x2o_round,y2o_round,tileSize));
	    }
	    
	    
	    
	    //if slope Infinity draw vetical line
	    if( vertical ){
	    	for(var i=0;i<=ly1;i++){
	    		// ctx.drawPoint(x1o_round,y1o_round + i,color,scale);
	    		tiles.push(new GIScene.Grid.Index(x1o_round,y1o_round + i,tileSize));
	    		//be tolerant to floating point errors
	    		if( Math.floor( ( Math.abs(x1o)%1 )*10000 )/10000 == 0.5 ){ 
	    			// ctx.drawPoint(x1o_round-1,y1o_round + i,"green",scale);
	    			tiles.push(new GIScene.Grid.Index(x1o_round-1,y1o_round + i,tileSize));
	    		}
	    	}
	    }
	    
	    if( horizontal ){
	    	for(var i=0;i<=lx1;i++){
	    		// ctx.drawPoint(x1o_round+i,y1o_round,color,scale);
	    		tiles.push(new GIScene.Grid.Index(x1o_round+i,y1o_round,tileSize));
	    		//be tolerant to floating point errors
	    		if( Math.floor( ( Math.abs(y1o)%1 )*10000 )/10000 == 0.5 ){ 
	    			// ctx.drawPoint(x1o_round +i,y1o_round - 1,"green",scale);
	    			tiles.push(new GIScene.Grid.Index(x1o_round +i,y1o_round - 1,tileSize));
	    		}
	    	}
	    }
	    
	    return tiles;
//};	
	 },
	
	addEventListener: THREE.EventDispatcher.prototype.addEventListener,
	hasEventListener: THREE.EventDispatcher.prototype.hasEventListener,
	removeEventListener: THREE.EventDispatcher.prototype.removeEventListener,
	dispatchEvent: THREE.EventDispatcher.prototype.dispatchEvent
	
};