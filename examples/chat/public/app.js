var app = angular.module('app', []);
var socket = io();

app.controller('GoBoardController', function($scope){

//GLOBAL VARIABLES
	$scope.globalVar = {
		boardLength: 9,				//GLOBAL set boardLength
		turnNumber: 1,				//turn counter(used to switch player)
		turnColor: 'black',
		oppositeTurnColor: 'white',
		colorStatus: '',
		allEmptyFlag: false,
		anyEmptyFlag: false,
		enemySurroundFlag: false,
		tookEnemyFlag: false,
		anyEmptyCounter: 0,
		blackScore: 0,
		whiteScore: 0,
		passCounter: 0,
		piecesTakenThisTurn: 0,
		blackCounterFlag: false,
		whiteCounterFlag: false,
		idsTakenThisTurn: [],
		turnHistory: [],				//chaches goBoard every turn
		pointsAddedCounter: 0,
		coloredCheckedPieces: []
	}

//EMIT MOUSE UP EVENT
	$scope.emitMouseUp = function(row, col){
		socket.emit('emitMouseUp', {
			row: row,
			col: col
		});
	}

	socket.on('emitMouseUp', function (data){
		$scope.$apply(function(){
			$scope.mouseUpFunction($scope.goBoard[data.row][data.col], data.row, data.col);
		});
	});

//EMIT PASS BUTTON
	$scope.emitPass = function(){
		socket.emit('emitPass');
	}

	socket.on('emitPass', function (){
		$scope.$apply(function() {
			$scope.pass();
		});
	});


//EMIT BACK BUTTON
	$scope.emitBack = function(){
		socket.emit('emitBack');
	}
	socket.on('emitBack', function (){
		$scope.$apply(function() {
			$scope.goBack();
		});
	});


//EMIT RESET BUTTON
	$scope.emitReset = function(){
		socket.emit('emitReset');
	}
	socket.on('emitReset', function (){
		$scope.$apply(function() {
			$scope.resetBoard();
		});
	});
	
//PASS EVENT
	$scope.pass = function () {
		$scope.globalVar.turnColor = oppositeTurnColor($scope.globalVar.turnColor);
		$scope.globalVar.turnNumber++;
		$scope.globalVar.passCounter++;

		$scope.globalVar.turnHistory = saveBoardState($scope.goBoard, $scope.globalVar.turnHistory);

		if($scope.globalVar.passCounter == 2){
			alert('BOTH PLAYERS PASS' + '\n' + 'counting player territories');
			resetCheckedStatus($scope.goBoard);		//might not be necessary
			$scope.globalVar.pointsAddedCounter = 0;

			territoryCounter();
		}
	}

//TERRITORY COUNTER FUNCTIONS
	function territoryCounter(){
		for(var i = 0; i < $scope.goBoard.length; i++){
			for(var j = 0; j < $scope.goBoard[i].length ; j++){
				var cell = $scope.goBoard[i][j];
				blackCounterFlag = false;
				whiteCounterFlag = false;
				$scope.globalVar.pointsAddedCounter = 0;

				console.log('idNum: ' + cell.idNum);

				if(cell.colorStatus == 'white' || cell.colorStatus == 'black'){
					cell.checkedStatus = false;
				}

				if(cell.checkedStatus == false){
					if(cell.colorStatus == 'emptySpot'){
						console.log('emptySpot');
						$scope.globalVar.pointsAddedCounter++;

						checkLegalNeighbours(cell);

					}else if(cell.colorStatus == 'black'){
						console.log('black');
					}else if(cell.colorStatus == 'white'){
						console.log('white');
					}

					if(blackCounterFlag == true && whiteCounterFlag == true){
						console.log('no mans turf');
					}else if(blackCounterFlag == true && whiteCounterFlag == false){
						console.log('black turf' + '\n' + $scope.globalVar.pointsAddedCounter
							+ ' points added to black');
						alert('+' + $scope.globalVar.pointsAddedCounter + ' to black');
						$scope.globalVar.blackScore += $scope.globalVar.pointsAddedCounter;
					}else if(blackCounterFlag == false && whiteCounterFlag == true){
						console.log('white turf' + '\n' + $scope.globalVar.pointsAddedCounter
							+ ' points added to white');
						alert('+' + $scope.globalVar.pointsAddedCounter + ' to white');
						$scope.globalVar.whiteScore += $scope.globalVar.pointsAddedCounter;
					}else if(blackCounterFlag == false && whiteCounterFlag == false){
						console.log('no points');
					}
				}
			}
		}
	}

	function checkLegalNeighbours(cell){
		if(cell.checkedStatus == false){
			cell.checkedStatus = true;
			if(cell.cellRow > 1){
				var focusPiece = $scope.goBoard[(cell.cellRow-2)][cell.cellCol-1];
				checkForEmpties(focusPiece, cell);
			}
			if(cell.cellCol > 1){
				var focusPiece = $scope.goBoard[(cell.cellRow-1)][cell.cellCol-2];
				checkForEmpties(focusPiece, cell);
			}
			if(cell.cellCol < $scope.globalVar.boardLength){
				var focusPiece = $scope.goBoard[(cell.cellRow-1)][cell.cellCol];
				checkForEmpties(focusPiece, cell);
			}
			if(cell.cellRow < $scope.globalVar.boardLength){
				var focusPiece = $scope.goBoard[(cell.cellRow)][cell.cellCol-1];
				checkForEmpties(focusPiece, cell);
			}
		}
	}

	function checkForEmpties(focusPiece, cell){
		console.log('cell.idNum: ' + cell.idNum + '\n' + 'focusPiece.idNum: ' + focusPiece.idNum);
		cell.checkedStatus = true;
		if(focusPiece.checkedStatus == false){
			if(focusPiece.colorStatus == 'emptySpot'){
				console.log('trigger recursive check');
				$scope.globalVar.pointsAddedCounter++;
				checkLegalNeighbours(focusPiece);
			}else if(focusPiece.colorStatus == 'black'){
				blackCounterFlag = true;
			}else if(focusPiece.colorStatus == 'white'){
				whiteCounterFlag = true;
			}
		}
	}

//goBoard GAME HISTORY
	function saveBoardState(goBoard, turnHistory){
		var currentTurn = [];

		if($scope.globalVar.turnNumber - 2 <= turnHistory.length){
			for(var i = 0; i < $scope.goBoard.length; i++){
				for(var j = 0; j < $scope.goBoard[i].length; j++){
					if($scope.goBoard[i][j].colorStatus == 'emptySpot'){
						currentTurn.push('emptySpot');
					}else if($scope.goBoard[i][j].colorStatus == 'black'){
						currentTurn.push('black');
					}else if($scope.goBoard[i][j].colorStatus == 'white'){
						currentTurn.push('white');
					}
				}
			}
			currentTurn.push($scope.globalVar.blackScore);
			currentTurn.push($scope.globalVar.whiteScore);			

			turnHistory.push(currentTurn);
		}else{
			alert('turns out of whack!');
		}
		return turnHistory;
	}

//goBack EVENT
	$scope.goBack = function(){
		if($scope.globalVar.turnHistory.length == 1){
			$scope.resetBoard();		//first turn
		}else if($scope.globalVar.turnHistory.length == 0){
			alert('already at the beginning');
		}else{
			var gridSize = $scope.globalVar.boardLength * $scope.globalVar.boardLength;
			var targetTurn = $scope.globalVar.turnHistory.length - 2;
			var targetBoard = [];
			var boardIdNum = 0;

			for(var i = 0; i < gridSize; i++){
				targetBoard.push($scope.globalVar.turnHistory[targetTurn][boardIdNum]);
				boardIdNum++;
			}

			boardIdNum = 0;

			for(var i = 0; i < $scope.goBoard.length; i++){
				for(var j = 0; j < $scope.goBoard[i].length; j++){
					$scope.goBoard[i][j].colorStatus = targetBoard[boardIdNum];
					boardIdNum++;
				}
			}

			$scope.globalVar.blackScore = $scope.globalVar.turnHistory[targetTurn][gridSize];
			$scope.globalVar.whiteScore = $scope.globalVar.turnHistory[targetTurn][gridSize+1];

			$scope.globalVar.turnNumber--;
			$scope.globalVar.turnColor = oppositeTurnColor($scope.globalVar.turnColor);
			$scope.globalVar.turnHistory.pop();
		}
	}

//resetBoard EVENT
	$scope.resetBoard = function(){
		for(var i = 0; i < $scope.goBoard.length; i++){
			for(var j = 0; j < $scope.goBoard[i].length; j++){
				$scope.goBoard[i][j].colorStatus = 'emptySpot';
			}
		}
		$scope.globalVar.turnNumber = 1;
		$scope.globalVar.whiteScore = 0;
		$scope.globalVar.blackScore = 0;
		$scope.globalVar.turnColor = 'black';
		$scope.globalVar.turnHistory = [];
		alert('board reset');
	}

//HAVE TO SAVE ALL DEPENDENCIES AS FILES IN THE FOLDER (no more CDN bullshit)
//BOOTSTRAP IS STILL IN CDN FORMAT!!! FIX IT


//HAVE TO MAKE A COUNTING MODE...

//GETS TRIGGERED IN THE BOTH PLAYERS PASS if()
//NOW THE RECURSION CHECKS THE WHOLE goBoard FOR 'emptySpot's
//IF IT FINDS BOTH BLACK AND WHITE PIECES ATTACHED TO STRINGS OF 'emptySpot's
//DOES NOTHING
//IF IT FINDS ONLY ONE COLOR
//IT ADDS THE NUMBER OF 'emptySpot's IN THAT CHAIN TO THAT COLORS SCORE

//FOR NOW THE PLAYERS MUST HAVE NO ENEMY PIECES IN THEIR TERRITORY FOR THIS TO WORK


//HAVE TO MAKE AN AFTER GAME DELETION MODE...

//BUT I CAN INCLUDE AN AFTER GAME DELETION MODE WHERE PLAYERS HIGHLIGHT OFFENDING
//PIECES TO BE DELETED FROM THEIR TERRITORY
//IF BOTH PLAYERS PRESS AN ACCEPT BUTTON
//THOSE HIGHLIGHTED PIECES GET DELETED AND ADDED TO THE APPROPRIATE SCORE COUNTERS
//NOW THE AUTO COUNTER WILL WORK JUST FINE


//MOUSE UP EVENT
	$scope.mouseUpFunction = function(cell, row, col){
		if(cell.colorStatus == 'emptySpot'){
			$scope.globalVar.allEmptyFlag = false;			//reset the allEmptyFlag
			$scope.globalVar.anyEmptyFlag = false;			//reset the anyEmptyFlag
			$scope.globalVar.enemySurroundFlag = false;		//reset the enemySurroundFlag
			$scope.globalVar.tookEnemyFlag = false;			//reset the tookEnemyFlag
			$scope.globalVar.anyEmptyCounter = 0;			//reset the anyEmptyCounter
			$scope.globalVar.piecesTakenThisTurn = 0;		//reset the piecesTakenThisTurn

			if($scope.globalVar.idsTakenThisTurn[0] == cell.idNum){
				alert('illegal move, play again');
				cell.colorStatus = 'emptySpot';
				$scope.globalVar.turnHistory.pop();	//pop out the last turnHistory
				$scope.globalVar.turnNumber--;		//	since it will save a new turn anyway later
			}else{
				$scope.globalVar.idsTakenThisTurn = [];			//reset the idsTakenThisTurn
				resetCheckedStatus($scope.goBoard);
				resetToTakeStatus($scope.goBoard);


				$scope.globalVar.turnColor = getTurnColor($scope.globalVar.turnNumber, cell, $scope.globalVar.turnColor);
				
				checkNeighbours(cell, row, col, $scope.globalVar.boardLength, $scope.goBoard);

				checkSingleIllegal(cell);
				checkMultipleIllegal(cell);
				illegalRepeatMove(cell);
			}

			$scope.globalVar.turnNumber++;
			$scope.globalVar.passCounter = 0;
			$scope.globalVar.piecesTakenThisTurn = 0;

			$scope.globalVar.turnHistory = saveBoardState($scope.goBoard, $scope.globalVar.turnHistory);
		}
	}

//CHECK FOR REPEAT MOVES
	function illegalRepeatMove(cell){
		if($scope.globalVar.piecesTakenThisTurn == 1){
			//alert('you cant play on id#' + $scope.globalVar.idsTakenThisTurn[0]);
		}else{
			$scope.globalVar.idsTakenThisTurn = [];	//clear the list of pieces if more than 1
		}
	}

//CHECK anyEmptyCounter TO SEE IF YOU SHOULD TAKE ANY PIECES
	function checkAnyEmptyCounter(anyEmptyCounter, goBoard){
		//alert('anyEmptyCounter = ' + anyEmptyCounter);
		if(anyEmptyCounter == 0){
			//alert('Youve taken some pieces');
			$scope.globalVar.tookEnemyFlag = true;
			for(var i = 0; i < goBoard.length; i++){
				for(var j = 0; j < goBoard[i].length; j++){
					if(goBoard[i][j].toTakeStatus == true){
						goBoard[i][j].toTakeStatus = false;
						if(goBoard[i][j].colorStatus == 'black'){
							$scope.globalVar.whiteScore++;
						}else{
							$scope.globalVar.blackScore++;
						}
						$scope.globalVar.piecesTakenThisTurn++;
						($scope.globalVar.idsTakenThisTurn).push(goBoard[i][j].idNum);
						goBoard[i][j].colorStatus = 'emptySpot';
					}
				}
			}
		}
		$scope.globalVar.anyEmptyCounter = 0;
	}

//RESET THE checkedStatus BOOLEAN
	function resetCheckedStatus(goBoard){
		for(var i = 0; i < goBoard.length; i++){
			for(var j = 0; j < goBoard[i].length; j++){
				goBoard[i][j].checkedStatus = false;
			}
		}
	}

//RESET THE toTakeStatus BOOLEAN
	function resetToTakeStatus(goBoard){
		for(var i = 0; i < goBoard.length; i++){
			for(var j = 0; j < goBoard[i].length; j++){
				goBoard[i][j].toTakeStatus = false;
			}
		}
	}

//CHECK FRIENDLIES FOR POTENTIAL ILLEGAL MOVE
	function checkIllegalFriendly(cell, boardLength, goBoard){
		resetCheckedStatus($scope.goBoard);
		resetToTakeStatus($scope.goBoard);
		$scope.globalVar.anyEmptyCounter = 0;

		checkEnemies(cell, boardLength, goBoard);

		if($scope.globalVar.anyEmptyCounter == 0){
			alert('illegal move, play again');
			cell.colorStatus = 'emptySpot';
			$scope.globalVar.turnHistory.pop();
			$scope.globalVar.turnNumber--;
			$scope.globalVar.turnColor = oppositeTurnColor($scope.globalVar.turnColor);
		}

		$scope.globalVar.anyEmptyCounter = 0;
	}

//CHECK ENEMIES  -----  the 'cell' is an object like 'goBoard[row][col]'
	function checkEnemies(cell, boardLength, goBoard){
		//alert('checkEnemies().cell = ' + cell + '\n' +
		//	'checkEnemies().cell.colorStatus = ' + cell.colorStatus + '\n' +
		//	'checkEnemies().cell.checkedStatus = ' + cell.checkedStatus + '\n' +
		//	'checkEnemies().cell.idNum = ' + cell.idNum);
		if(cell.checkedStatus == false){
			cell.checkedStatus = true;

			if(cell.cellRow > 1){
				//alert('checkEnemies checkUp' + '\n' +
				//	cell.cellRow + '-' + cell.cellCol + ' -> ' + (cell.cellRow-1) + '-' + cell.cellCol);
				var focusPiece = goBoard[(cell.cellRow-2)][cell.cellCol-1];
				ifCheckRecursion(focusPiece, cell);
			}
			if(cell.cellCol > 1){
				//alert('checkEnemies checkLeft' + '\n' +
				//	cell.cellRow + '-' + cell.cellCol + ' -> ' + cell.cellRow + '-' + (cell.cellCol-1));
				var focusPiece = goBoard[(cell.cellRow-1)][cell.cellCol-2];
				ifCheckRecursion(focusPiece, cell);
			}
			if(cell.cellCol < boardLength){
				//alert('checkEnemies checkRight' + '\n' +
				//	cell.cellRow + '-' + cell.cellCol + ' -> ' + cell.cellRow + '-' + (cell.cellCol+1));
				var focusPiece = goBoard[(cell.cellRow-1)][cell.cellCol];
				ifCheckRecursion(focusPiece, cell);
			}
			if(cell.cellRow < boardLength){
				//alert('checkEnemies checkDown' + '\n' +
				//	cell.cellRow + '-' + cell.cellCol + ' -> ' + (cell.cellRow+1) + '-' + cell.cellCol);
				var focusPiece = goBoard[(cell.cellRow)][cell.cellCol-1];
				ifCheckRecursion(focusPiece, cell);
			}
		}
	}

//CONTINUE CHECK IF STATEMENTS
	function ifCheckRecursion(focusPiece, cell){
		if(focusPiece.checkedStatus == false){
			if(cell.colorStatus == focusPiece.colorStatus){
				//alert('triggering checkEnemies() for id#' + focusPiece.idNum);
				focusPiece.toTakeStatus = true;
				checkEnemies(focusPiece, $scope.globalVar.boardLength, $scope.goBoard);
			}else if(focusPiece.colorStatus != 'emptySpot' && focusPiece.colorStatus != cell.colorStatus){
				//alert('found opposite here: ' + focusPiece.idNum);
			}else if(focusPiece.colorStatus == 'emptySpot'){
				//alert('found empty.  moving on');
				focusPiece.checkedStatus = true;
				$scope.globalVar.anyEmptyCounter++;
			}else{
				alert('this should never have popped up');
			}
		}else{
			//alert('already checked this piece');
		}
	}

//CHECK NEIGHBOURS
	function checkNeighbours(cell, row, col, boardLength, goBoard){
		var immediateEmptyCount = 0;
		var immediateEnemyCount = 0;
		var immediateFriendlyCount = 0;
		var spotsChecked = 0;

		//alert('looking at'+'\n'+'row: '+(row+1)+'\n'+'col: '+(col+1));

		if(row > 0){						//check up
			var checkUp = goBoard[row-1][col];
			if(checkUp.colorStatus == 'emptySpot'){
				immediateEmptyCount++;
				//alert('checkUp found emptySpot');
			}
			if(checkUp.colorStatus == cell.colorStatus){
				immediateFriendlyCount++;
				//alert('checkUp found friendly');
			}
			if(checkUp.colorStatus == oppositeTurnColor(cell.colorStatus)){
				immediateEnemyCount++;
				//alert('checkUp found enemy');
				checkUp.toTakeStatus = true;
				checkEnemies(checkUp, boardLength, goBoard);
				checkAnyEmptyCounter($scope.globalVar.anyEmptyCounter, $scope.goBoard);
			}
			spotsChecked++;
		}
		resetToTakeStatus($scope.goBoard);
		resetCheckedStatus($scope.goBoard);

		if(col > 0){						//check left
			var checkLeft = goBoard[row][col-1];
			if(checkLeft.colorStatus == 'emptySpot'){
				immediateEmptyCount++;
				//alert('checkLeft found emptySpot');
				checkLeft.checkedStatus = true;
			}
			if(checkLeft.colorStatus == cell.colorStatus){
				immediateFriendlyCount++;
				//alert('checkLeft found friendly');
			}
			if(checkLeft.colorStatus == oppositeTurnColor(cell.colorStatus)){
				immediateEnemyCount++;
				//alert('checkLeft found enemy');
				checkLeft.toTakeStatus = true;
				checkEnemies(checkLeft, boardLength, goBoard);
				checkAnyEmptyCounter($scope.globalVar.anyEmptyCounter, $scope.goBoard);
			}
			spotsChecked++;
		}
		resetToTakeStatus($scope.goBoard);
		resetCheckedStatus($scope.goBoard);

		if(col < boardLength-1){			//check right
			var checkRight = goBoard[row][col+1];
			if(checkRight.colorStatus == 'emptySpot'){
				immediateEmptyCount++;
				//alert('checkRight found emptySpot');
				checkRight.checkedStatus = true;
			}
			if(checkRight.colorStatus == cell.colorStatus){
				immediateFriendlyCount++;
				//alert('checkRight found friendly');
			}
			if(checkRight.colorStatus == oppositeTurnColor(cell.colorStatus)){
				immediateEnemyCount++;
				//alert('checkRight found enemy');
				checkRight.toTakeStatus = true;
				checkEnemies(checkRight, boardLength, goBoard);
				checkAnyEmptyCounter($scope.globalVar.anyEmptyCounter, $scope.goBoard);
			}
			spotsChecked++;
		}
		resetToTakeStatus($scope.goBoard);
		resetCheckedStatus($scope.goBoard);

		if(row < boardLength-1){			//check down
			var checkDown = goBoard[row+1][col];
			if(checkDown.colorStatus == 'emptySpot'){
				immediateEmptyCount++;
				//alert('checkDown found emptySpot');
				checkDown.checkedStatus = true;
			}
			if(checkDown.colorStatus == cell.colorStatus){
				immediateFriendlyCount++;
				//alert('checkDown found friendly');
			}
			if(checkDown.colorStatus == oppositeTurnColor(cell.colorStatus)){
				immediateEnemyCount++;
				//alert('checkDown found enemy');
				checkDown.toTakeStatus = true;
				checkEnemies(checkDown, boardLength, goBoard);
				checkAnyEmptyCounter($scope.globalVar.anyEmptyCounter, $scope.goBoard);
			}
			spotsChecked++;
		}
		resetToTakeStatus($scope.goBoard);
		resetCheckedStatus($scope.goBoard);

		//alert('the spots beside this one are: '+'\n'+
		//	'empty- '+immediateEmptyCount+'\n'+
		//	'friendly- '+immediateFriendlyCount+'\n'+
		//	'enemy- '+immediateEnemyCount);

		if(immediateEnemyCount == spotsChecked){
			$scope.globalVar.enemySurroundFlag = true;
		}
		if(immediateEmptyCount == spotsChecked){
			$scope.globalVar.allEmptyFlag = true;
		}
		if(immediateEmptyCount > 0){
			$scope.globalVar.anyEmptyFlag = true;
		}
		//alert('allEmptyFlag is - ' + $scope.globalVar.allEmptyFlag+'\n'+
		//	'anyEmptyFlag is - ' + $scope.globalVar.anyEmptyFlag+'\n'+
		//	'enemySurroundFlag is - ' + $scope.globalVar.enemySurroundFlag+'\n'+
		//	'tookEnemyFlag is - ' + $scope.globalVar.tookEnemyFlag);
	}

//CHECK FOR ILLEGALS
	function checkSingleIllegal(cell){
		if($scope.globalVar.enemySurroundFlag == true && $scope.globalVar.tookEnemyFlag == false){
			alert('illegal move, play again');
			cell.colorStatus = 'emptySpot';
			$scope.globalVar.turnNumber--;
			$scope.globalVar.turnColor = oppositeTurnColor($scope.globalVar.turnColor);
		}
	}

	function checkMultipleIllegal(cell){
		if($scope.globalVar.anyEmptyFlag == false && $scope.globalVar.tookEnemyFlag == false &&
			$scope.globalVar.enemySurroundFlag == false){
			//alert('potential illegal move' + '\n' + 'check friendlies for empty spaces');
			checkIllegalFriendly(cell, $scope.globalVar.boardLength, $scope.goBoard);
		}
	}

//MAKING THE BOARD
	$scope.goBoard = goBoardSetup($scope.globalVar.boardLength);

	function goBoardSetup(boardLength){
		var boardArray = [];
		var idNum = 1;

		for(var row=1; row < boardLength+1; row++){
			boardArray.push([]);
			for(var col=1; col < boardLength+1; col++){
				boardArray[row-1][col-1] = {
					idNum:idNum,
					cellRow:row,
					cellCol:col,
					colorStatus:'emptySpot',
					boardCornerSide:boardCornerSide(row, col, boardLength),
					mouseOverStatus: '',
					checkedStatus: false,
					toTakeStatus: false
				};
				idNum++;
			}
		}
		return boardArray;
	}

	function boardCornerSide(row, col, boardLength){
		if(row == 1 || row == boardLength || col == 1 || col == boardLength){
			if(row + col == 2 || row + col == boardLength + 1 || row + col == boardLength * 2){
				return 'corner';
			}else{
				return 'side';
			}
		}else{
			return 'normal';
		}
	}

//GET TURN COLOR
	function getTurnColor(turnNumber, cell, turnColor){
		if(turnNumber % 2 == 1){
				cell.colorStatus = 'black';
				turnColor = 'white';
			}else{
				cell.colorStatus = 'white';
				turnColor = 'black';
			}
		return turnColor;
	}

//OPPOSITE TURN COLOR
	function oppositeTurnColor(turnColor){
		if(turnColor == 'black'){
			turnColor = 'white';
			return turnColor;
		}else{
			turnColor = 'black';
			return turnColor;
		}
	}

//end of CONTROLLER
});