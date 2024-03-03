
$().ready(function() {
	$("ins.sudoku").each(function (){
		var id = $(this).data("id");
		var level = $(this).data("level");
		if (!level)
			level = 3;
		//var grid = JSON.parse($(this).data("grid"));
		var grid = $(this).data("grid");
		//var gridSolve = JSON.parse($(this).data("grid-solve"));
		var gridSolve = $(this).data("grid-solve");
		var divId = "sudoku_"+(id)+"_"+(level)+"_"+Math.ceil(Math.random()*10000);
		$(this).after("<div id='"+divId+"'></div>");
		new SudokuObject(id, level, grid, gridSolve).draw(divId);
	});
	$("div.i1").click(function() {
		var sudokuObject = this.sudokuRootElement.sudokuObject;
		sudokuObject.selectCell(this);
	});
	$("div.cp1").click(function() {
		var sudokuObject = this.sudokuRootElement.sudokuObject;
		sudokuObject.push();
		sudokuObject.setNum($(this).data("num"));
		sudokuObject.setCookie();
	});
	$("div.draw-cell").hover(
		function() {
			$(this).addClass("hover");
		},
		function() {
			$(this).removeClass("hover");
		});
	$("button.clear").click(function() {
		var sudokuObject = this.parentElement.parentElement.parentElement.parentElement.sudokuObject;
		sudokuObject.push();
		sudokuObject.clear();
		sudokuObject.deleteCookie();
	});
	$("button.solve").click(function() {
		var sudokuObject = this.parentElement.parentElement.parentElement.parentElement.sudokuObject;
		sudokuObject.push();
		sudokuObject.solve();
		sudokuObject.setCookie();
	});
	$("button.print").click(function() {
		window.print();
	});
	$(".clear-all").click(function() {
		if (confirm("Все ваши решения будут удалены. Вы уверены?"))
		{
			if ($.jStorage.storageAvailable())
				$.jStorage.flush();
			//else clearCookie();
			refreshSolves();
		}
	});
	$("button.x-save").click(function() {
		var sudokuObject = this.parentElement.parentElement.parentElement.parentElement.sudokuObject;
		sudokuObject.xSave();
	});
	$("button.x-undo").click(function() {
		var sudokuObject = this.parentElement.parentElement.parentElement.parentElement.sudokuObject;
		if (confirm("Вернуть судоку в предыдущее состояние?"))
		{
			sudokuObject.xUndo();
			sudokuObject.setCookie();
		}
	});
	$("button.undo").click(function() {
		var sudokuObject = this.parentElement.parentElement.parentElement.parentElement.sudokuObject;
		sudokuObject.undo();
		sudokuObject.setCookie();
	});
	$("button.tips").click(function() {
		var sudokuObject = this.parentElement.parentElement.parentElement.parentElement.sudokuObject;
		sudokuObject.push();
		sudokuObject.tips();
		sudokuObject.setCookie();
	});

	refreshSolves();
});

function refreshSolves()
{
	$(".sudoku-image").each(function() {
		var id = $(this).data("id");
		var level = $(this).data("level");
		var name = id+"_"+level;
		var cookie = "";
		if ($.jStorage.storageAvailable())
			cookie = $.jStorage.get(name, "");
		else
			cookie = getCookie(name);
		if (cookie) {
			if (cookie[0] == "+")
				$(this).addClass("solved-label");
			else if (cookie.indexOf("_") >= 0)
				$(this).addClass("started-label");
			else {
				$(this).removeClass("solved-label");
				$(this).removeClass("started-label");
			}
		}
	});
}

function SudokuObject(id, level, grid, gridSolve) {
	this.id = id;
	this.level = level;
	this.solved = false;
	this.grid = grid;
	this.gridSolve = gridSolve;
	this.grid2 = [];
	this.xStored = [];
	for(var i=1;i<=9;i++)
		this.grid2[i] = [];

//	this.curX = 0;
//	this.curY = 0;
	this.cur = null;
	this.selectCell = function(obj2) {
//    var obj = this.getObject(this.curX, this.curY);
		var obj = this.cur;
    if (obj != null) {
			$(obj).removeClass("selected");
    }

    obj = $(obj2);
    if (obj != null) {
			$(obj).addClass("selected");
    }
		this.cur = obj;
//    this.curX = obj.data("x");
//    this.curY = obj.data("y");
	};

	this.selectCell2 = function(i, j) {
    this.selectCell(this.getObject(i, j));
	};

	this.setNum = function (n) {
    //var obj = this.getObject(this.curX, this.curY);
		var obj = this.cur;
    if (obj != null) {
        this.setValue(obj, n);
        this.checkAllErrors();
    }
	};

	this.tips = function() {
		var obj = this.cur;
    if (obj != null) {
//    this.curX = obj.data("x");
//    this.curY = obj.data("y");
        this.setValue(obj, this.gridSolve[obj.data("x")-1][obj.data("y")-1]);
        this.checkAllErrors();
    }
	};

	this.getElementId = function (x, y) {
    return "c" + (x) + (y) + "_" + id;
	};

	this.getValue = function (x, y) {
    return this.getValue2(this.getObject(x, y));
	};

	this.getValue2 = function (obj) {
    if (obj != null)
        return $(obj).html();
    return "";
	};

	this.setValue = function (obj, value) {
    if (obj != null)
        $(obj).html(value);
	};

// возвращает объект по координатам
	this.getObject = function (x, y) {
    //var obj = $("div.i1[data-x='"+x+"'][data-y='"+y+"']");
    var obj = this.grid2[x][y];
    return obj;
	};

// выполняет проверку всех клеток
	this.checkAllErrors = function () {
    var isError = false;
    var isFilled = true;
    var i, j;
    for (i = 1; i <= 9; i++) {
			for (j = 1; j <= 9; j++) {
				isError = this.checkCell(i, j) || isError;
				isFilled = isFilled && (this.getValue(i, j) != "");
			}
		}
		this.solved = isFilled && !isError;
		if (this.solved)
			$(this.rootElement).addClass("status-solved");
		else
			$(this.rootElement).removeClass("status-solved");
		return isError;
	};

// проверяет одну клетку
	this.checkCell = function (x, y) {
    var isError = false;

    var checkValue = this.getValue(x, y);
    var checkObj = this.getObject(x, y);

    if (checkValue != "") {
        isError = isError || this.checkRow(x, y, checkValue, checkObj);
        isError = isError || this.checkCol(x, y, checkValue, checkObj);
        isError = isError || this.checkSquare(x, y, checkValue, checkObj);
    }
    if (isError)
			$(checkObj).addClass("error");
    else
			$(checkObj).removeClass("error");
		return isError;
	};

// проверяет клетку в строке
	this.checkRow = function (x, y, checkValue, checkObj) {
    var i, j;

    var isError = false;
    for (i = 1; i <= 9; i++) {
        if (i == x) continue; // не сравнивать с проверяемой клеткой
        var value = this.getValue(i, y);
        if (value == checkValue) {
            isError = true;
            break;
        }
    }
    return isError;
	};

// проверяет клетку в столбце
	this.checkCol = function (x, y, checkValue, checkObj) {
    var i, j;

    var isError = false;
    for (j = 1; j <= 9; j++) {
        if (j == y) continue; // не сравнивать с проверяемой клеткой
        var value = this.getValue(x, j);
        if (value == checkValue) {
            isError = true;
            break;
        }
    }
    return isError;
	};

// проверяет клетку в квадрате
	this.checkSquare = function (x, y, checkValue, checkObj) {
    var i, j;
    var sq = Array(1, 1, 1, 4, 4, 4, 7, 7, 7);
    var i1 = sq[x - 1];
    var j1 = sq[y - 1];

    var isError = false;
    for (i = i1; i <= i1 + 2 && !isError; i++)
        for (j = j1; j <= j1 + 2; j++) {
        if (i == x && j == y) continue; // не сравнивать с проверяемой клеткой
        var value = this.getValue(i, j);
        if (value == checkValue) {
            isError = true;
            break;
        }
    }
    return isError;
	};

// восстанавливает решение из строки
	this.restore = function (s) {
    if (!s || s.length <= 0) return;

    s = s.substring(1);
    for (var y = 1; y <= 9; y++) {
        for (var x = 1; x <= 9; x++) {
            var obj = this.getObject(x, y);
            if (obj != null && obj.className.indexOf("fixed") < 0) {
                var n = "";
                var i = (y - 1) * 9 + (x - 1);
                if (i < s.length)
                    n = s.substr(i, 1);
                if (n == "_")
                    n = "";
                this.setValue(obj, n);
            }
        }
    }
    this.checkAllErrors();
	};

// сохраняет текущее значение в строку
	this.save = function () {
    var s = "-";
    if (this.solved)
    	s = "+";
		for (var y = 1; y <= 9; y++) {
			for (var x = 1; x <= 9; x++) {
				var obj = this.getObject(x, y);
				if (obj != null) {
					var value = this.getValue2(obj);
					if (value != "")
						s = s + value;
					else
						s = s + "_";
				}
				else
					s = s + "_";
			}
		}
		return s;
	};

	this.clear = function () {
    for (var y = 1; y <= 9; y++) {
        for (var x = 1; x <= 9; x++) {
            var obj = this.getObject(x, y);
            if (obj.className.indexOf("fixed") < 0)
                this.setValue(obj, "");
        }
    }
    this.checkAllErrors();
	};

	this.solve = function() {
    for (var y = 1; y <= 9; y++) {
        for (var x = 1; x <= 9; x++) {
            var obj = this.getObject(x, y);
            if (obj.className.indexOf("fixed") < 0)
                this.setValue(obj, this.gridSolve[x-1][y-1]);
        }
    }
    this.checkAllErrors();
	};

	this.saveDays = 100;
		
	this.setCookie = function () {
		var name = this.id + "_" + this.level;
		var value = this.save();
		if ($.jStorage.storageAvailable())
			$.jStorage.set(name, value);
			//$.jStorage.set(name, value, {TTL: this.saveDays * 3600 * 24});
		else
			setCookie(name, value, this.saveDays);
	};

	this.deleteCookie = function () {
		var name= this.id + "_" + this.level;
		if ($.jStorage.storageAvailable())
			$.jStorage.deleteKey(name);
		else
			deleteCookie(name);
	};

	this.getCookie = function () {
		var name = this.id + "_" + this.level;
		if ($.jStorage.storageAvailable())
			return $.jStorage.get(name, "");
		else
			return getCookie(name);
	};

	this.draw = function(container) {
		var root = $("<div class='sudoku-container row theme-1 hidden-print' data-id='"+this.id+"' data-level='"+this.level+"'></div>");
		root[0].sudokuObject = this;
		this.rootElement = root[0];

		var net = $("<div class='net'></div>");
		root.append(net);
		var netTable = $('<div class="draw-table">');
		net.append(netTable);
		for(var i=1;i<=9;i++)
		{
			var row = $("<div class='draw-row'></div>");
			for(var j=1;j<=9;j++)
			{
				var drawCellTop = "";
				if (i==4||i==7)
					drawCellTop = " draw-cell-top";
				var drawCellLeft = "";
				if (j==4||j==7)
					drawCellLeft = " draw-cell-left";
				var drawCellType = " i1";
				var num = "";
				if (this.grid && this.grid[i-1][j-1] && this.grid[i-1][j-1]>0)
				{
					drawCellType = " fixed";
					num = this.grid[i-1][j-1];
				}
				var cell = $("<div class='draw-cell"+drawCellTop+drawCellLeft+drawCellType+"' data-x='"+(i)+"' data-y='"+(j)+"'>"+(num)+"</div>");
				cell[0].sudokuRootElement = root[0];
				row.append(cell);
				this.grid2[i][j] = cell[0];
			}
			netTable.append(row);
		}

		// draw vertical control panel
		var cp = $("<div class='control-panel vertical'></div>");
		root.append(cp);
		var nums = $("<div class='nums'></div>");
		cp.append(nums);
		var cpTable = $('<div class="draw-table">');
		nums.append(cpTable);
		{
			var row = $("<div class='draw-row'></div>");
			cpTable.append(row);
			var cell = $("<div class='draw-cell cp1' data-num=''>&nbsp;</div>");
				cell[0].sudokuRootElement = root[0];
			row.append(cell);
		}
		for(var i=1;i<=9;i++)
		{
			var row = $("<div class='draw-row'></div>");
			cpTable.append(row);
			var cell = $("<div class='draw-cell cp1' data-num='"+(i)+"'>"+(i)+"</div>");
				cell[0].sudokuRootElement = root[0];
			row.append(cell);
		}
		
		// draw horizontal control panel
		var hcp = $("<div class='control-panel horizontal'></div>");
		root.append(hcp);
		var hnums = $("<div class='nums'></div>");
		hcp.append(hnums);
		var cpTable = $('<div class="draw-table">');
		var row = $("<div class='draw-row'></div>");
		cpTable.append(row);
		hnums.append(cpTable);
		{
			var cell = $("<div class='draw-cell cp1' data-num=''>&nbsp;</div>");
			cell[0].sudokuRootElement = root[0];
			row.append(cell);
		}
		for(var i=1;i<=9;i++)
		{
			var cell = $("<div class='draw-cell cp1' data-num='"+(i)+"'>"+(i)+"</div>");
			cell[0].sudokuRootElement = root[0];
			row.append(cell);
		}
		
		// draw vertical buttons panel
		var buttons = $(
"<div class='buttons-panel'>"
+"  <p>"
+"    <button class='btn btn-default tips' title='Подсказать цифру для выбранной клетки'><span class='glyphicon glyphicon-plus' aria-hidden='true'></span> Подсказка</button>"
+"  </p>"
+"  <p>"
+"    <button class='btn btn-default undo hidden' title='Отменить предыдущий шаг'><span class='fa fa-undo' aria-hidden='true'></span> Отменить</button>"
+"  </p>"
+"  <hr/>"
+"  <p>"
+"    <button class='btn btn-default clear' title='Очистить судоку и сбросить сохраненное решение'><span class='glyphicon glyphicon-erase' aria-hidden='true'></span> Очистить</button>"
+"  </p>"
+"  <p>"
+"    <button class='btn btn-default solve' title='Заполнить судоку правильным решением и пометить как решенное'><span class='glyphicon glyphicon-ok-circle' aria-hidden='true'></span> Ответ</button>"
+"  </p>"
+"  <hr/>"
+"  <p>"
+"    <button class='btn btn-default print hidden-xs' title='Распечатать судоку'><span class='glyphicon glyphicon-print' aria-hidden='true'></span> Печатать</button>"
+"  </p>"
//+"  <p>"
//+"    <button class='btn btn-default btn-sm x-save' title='Запомнить текущее состояние судоку'><span class='glyphicon glyphicon-floppy-disk' aria-hidden='true'></span> Запомнить</button>"
//+"  </p>"
//+"  <p>"
//+"    <button class='btn btn-info btn-sm x-undo hidden' title='Восстановить предыдущее состояние'><span class='fa fa-undo' aria-hidden='true'></span> Откатить (0)</button>"
//+"  </p>"
+"  <p class='text-center solved-label' title='Решено'>"
+"    <span class='glyphicon glyphicon-star' aria-hidden='true'></span>"
+"    <span class='glyphicon glyphicon-star' aria-hidden='true'></span>"
+"    <span class='glyphicon glyphicon-star' aria-hidden='true'></span>"
+"  </p>"
+"</div>");
		cp.append(buttons);
		
		// draw horizontal buttons panel
		var buttons = $(
"<div class='buttons-panel'>"
+"  <p></p>"
+"  <p class='text-center solved-label' title='Решено'>"
+"    <span class='glyphicon glyphicon-star' aria-hidden='true'></span>"
+"    <span class='glyphicon glyphicon-star' aria-hidden='true'></span>"
+"    <span class='glyphicon glyphicon-star' aria-hidden='true'></span>"
+"  </p>"
+"  <p class='text-left'>"
+"    <button class='btn btn-default btn-sm tips' title='Подсказать цифру для выбранной клетки'><span class='glyphicon glyphicon-plus' aria-hidden='true'></span> Подсказка</button>"
+"    <button class='btn btn-default btn-sm undo hidden' title='Отменить предыдущий шаг'><span class='fa fa-undo' aria-hidden='true'></span> Отменить</button>"
+"    <button class='btn btn-default btn-sm clear' title='Очистить судоку и сбросить сохраненное решение'><span class='glyphicon glyphicon-erase' aria-hidden='true'></span> Очистить</button>"
+"    <button class='btn btn-default btn-sm solve' title='Заполнить судоку правильным решением и пометить как решенное'><span class='glyphicon glyphicon-ok-circle' aria-hidden='true'></span> Ответ</button>"
//+"    <button class='btn btn-default btn-sm print' title='Распечатать судоку'><span class='glyphicon glyphicon-print' aria-hidden='true'></span> Печатать</button>"
+"  </p>"
+"</div>");
		hcp.append(buttons);

		var a= $("#"+container).append(root);
		$("#"+container).append($("<div class='visible-print-block'><img src='/image?id="+this.id+"&level="+this.level+"&vid=0'></div>"));

		this.restore(this.getCookie());
	};
	
	this.xSave = function() {
		this.xStored.push(this.save());
		var text = $("button.x-undo").html().replace("("+(this.xStored.length-1)+")", "("+this.xStored.length+")");
		$("button.x-undo").html(text);
		$("button.x-undo").removeClass("hidden");
	};
	
	this.xUndo = function() {
		var stored = this.xStored.pop();
		if (stored)
			this.restore(stored);
		var text = $("button.x-undo").html().replace("("+(this.xStored.length+1)+")", "("+this.xStored.length+")");
		$("button.x-undo").html(text);
		if (this.xStored.length <= 0)
			$("button.x-undo").addClass("hidden");
	};
	
	this.push = function() {
		this.xStored.push(this.save());
		$("button.undo").removeClass("hidden");
	};
	
	this.undo = function() {
		var stored = this.xStored.pop();
		if (stored)
			this.restore(stored);
		if (this.xStored.length <= 0)
			$("button.undo").addClass("hidden");
	};
}