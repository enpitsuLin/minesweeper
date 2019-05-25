function Minesweeper() {
    this._initArguments.apply(this, arguments);
}
Minesweeper.prototype._initArguments = function () {
    this.Setting = {
        easy: { size: [8, 8], mineTotal: 8, },
        mid: { size: [10, 10], mineTotal: 15 },
        hard: { size: [14, 14], mineTotal: 20 }
    };
    //jQuery对象
    this.$board = $('.board');
    this.$timer = $('.timer')
    this.$mineCount = $('.mine-count');
    this.$dialog = $(".dialog")
    this.$setting = $(".setting"); //this.$setting.children(".size")
    //
    this.level = { mineTotal: 8, size: [8, 8] };
    this.mineCount = { open: 0, mark: 0 };
    this.gameover = false;
    this.state = { dead: false, win: false, time: 0 };
    this.interval = undefined;
    this.mineMap = [];
    this.initEvents()
};
Minesweeper.prototype._settingSize = function () {
    return [this.$setting.children(".size").children("input")[0].value,
    this.$setting.children(".size").children("input")[1].value
    ]
};
Minesweeper.prototype._settingMine = function () {
    return this.$setting.children(".mine").children("input")[0].value
};
Minesweeper.prototype._showDialog = function () {
    this.$dialog.show()
};
Minesweeper.prototype._hideDialog = function () {
    this.$dialog.hide()
};
Minesweeper.prototype.timer = function () {
    if (this.interval == undefined) {
        this.state.time = 0;
        this.interval = setInterval(() => {
            if (this.state.win || this.state.dead) {
                clearInterval(this.interval);
            }
            this.state.time++;
            const time = this.state.time;
            let min = ("0" + Math.floor(time / 60)).slice(-2);
            let sec = ("0" + (time % 60)).slice(-2);
            this.$timer.text(`${min}:${sec}`)
        }, 1000);
    }
};
Minesweeper.prototype.reset = function () {
    this.mineMap = [];
    this.$board.empty();
    this.init()
};
Minesweeper.prototype.init = function () {
    this.state = { dead: false, win: false, time: 0 };
    this.mineCount = { open: 0, mark: 0 };
    this.interval = clearInterval(this.interval);
    this.$timer.text("00:00");
    this.$mineCount.text(`剩余:${this.level.mineTotal}`)
    this.initboard();
};
Minesweeper.prototype.initboard = function () {
    this.mineMap = this.createmines();
    this.createboard()
};
Minesweeper.prototype.createboard = function () {
    for (let row = 0; row < this.mineMap.length; row++) {
        let $row = $('<div class = "row"></div>')
        for (let index = 0; index < this.mineMap[row].length; index++) {
            let $cell = $('<div data-row="' + row + '" data-index="' + index + '" class = "cell"></div>');
            $row.append($cell);
        }
        this.$board.append($row);
    }
};
Minesweeper.prototype.createmines = function () {
    const {
        mineTotal,
        size: [height, width]
    } = this.level;
    const empty = new Array(height * width - mineTotal).fill("false");
    const mines = new Array(mineTotal).fill("true");
    let mineMap = [];
    const shuffled = mines.concat(empty).sort(() => {
        return Math.random() > 0.5 ? -1 : 1;
    });
    for (let i = 0; i < shuffled.length; i += width) {
        const row = i / width;
        mineMap.push(
            shuffled
                .slice(i, i + width)
                .map((isMine, index) => ({ row: row, index, isMine }))
        );
    }
    for (let row = 0; row < height; row++) {
        for (let index = 0; index < width; index++) {
            const posMine = [
                [row - 1, index - 1],
                [row - 1, index],
                [row - 1, index + 1],
                [row, index - 1],
                [row, index + 1],
                [row + 1, index - 1],
                [row + 1, index],
                [row + 1, index + 1]
            ];
            let adjMine = 0;
            for (let i = 0; i < 8; i++) {
                let _row = posMine[i][0];
                let _column = posMine[i][1];
                if (
                    _row < 0 ||
                    _column < 0 ||
                    _row > height - 1 ||
                    _column > width - 1
                ) {
                    continue;
                }
                if (mineMap[_row][_column].isMine === "true") {
                    adjMine++;
                }
            }
            mineMap[row][index] = {
                row: row,
                index: index,
                adjMine: adjMine,
                isMine: mineMap[row][index].isMine,
                isOpen: false,
                isMark: false,
                isTrigger: false
            };
        }
    }
    return mineMap;
};
Minesweeper.prototype.handleOpen = function (row, index) {
    row = Number(row), index = Number(index)
    if (this.state.dead || this.state.win) return;
    const {
        size: [height, width]
    } = this.level;
    if (row < 0 || index < 0 || row > height - 1 || index > width - 1) return;

    let item = this.mineMap[row][index];
    if (item.isOpen) return;
    if (item.isMark) {
        this.mineMap[row][index].isMark = false;
        $('[data-row=' + row + '][data-index=' + index + ']').removeClass("mark")
        this.mineCount.mark--;
    }
    this.mineMap[row][index].isOpen = true;
    $('[data-row=' + row + '][data-index=' + index + ']').addClass("open")
    this.mineCount.open++;
    this.checkwin();
    if (item.isMine === "true") {
        this.mineMap[row][index].isTrigger = true;
        this.GameOver();
        $('[data-row=' + row + '][data-index=' + index + ']').addClass("trigger")
        return;
    }
    $('[data-row=' + row + '][data-index=' + index + ']').text(this.mineMap[row][index].adjMine)
    if (item.adjMine !== 0) return;
    this.handleOpen(row - 1, index);
    this.handleOpen(row + 1, index);
    this.handleOpen(row, index + 1);
    this.handleOpen(row, index - 1);
};
Minesweeper.prototype.handleMark = function (row, index) {
    if (this.state.dead || this.state.win) return;
    const item = this.mineMap[row][index];
    if (this.level.mineTotal - this.mineCount.mark - 1 < 0 || item.isOpen)
        return;
    this.mineCount.mark += item.isMark ? -1 : 1;
    this.mineMap[row][index].isMark = !this.mineMap[row][index].isMark;
    $('[data-row=' + row + '][data-index=' + index + ']').toggleClass("mark");
    this.$mineCount.text(`剩余:${this.level.mineTotal - this.mineCount.mark}`)
};
Minesweeper.prototype.showmines = function () {
    for (let row in this.mineMap) {
        let rowdata = this.mineMap[row];
        for (let index in rowdata) {
            const data = this.mineMap[row][index];
            if (data.isMine === "true") {
                data.isOpen = true;
                $('[data-row=' + row + '][data-index=' + index + ']').addClass("open")
                $('[data-row=' + row + '][data-index=' + index + ']').text("💣")//
            }
        }
    }
};
Minesweeper.prototype._mark = function (evt) {
    evt.preventDefault();
    let [row, index] = [$(evt.target).attr('data-row'),
    $(evt.target).attr('data-index')
    ];
    this.handleMark(row, index);
    this.timer();
}
Minesweeper.prototype._open = function (evt) {
    if (evt.which === 1) {
        let [row, index] = [$(evt.target).attr('data-row'),
        $(evt.target).attr('data-index')
        ];
        this.handleOpen(row, index)
        this.timer();
    }
};
Minesweeper.prototype.GameOver = function () {
    this.state.dead = true;
    //弹窗提醒
    $('.dialog-content').text("不幸踩雷╮(╯﹏╰)╭")
    this.showmines();
    this._showDialog()
    clearInterval(this.interval);

};
Minesweeper.prototype.checkwin = function () {
    const {
        size: [width, height],
        mineTotal
    } = this.level;
    const totalCell = width * height;
    if (this.mineCount.open + mineTotal === totalCell) {
        this.state.win = true;
        this.showmines();
        $('.dialog-content').text("优秀的排雷兵！")
        this._showDialog()
        clearInterval(this.interval);
    }
};
Minesweeper.prototype.initEvents = function () {
    let that = this
    $('.dialog').on('click', '.dialog-cover, button', () => this._hideDialog());

    this.$board.on('mousedown',
        '.cell', function (e) {
            that._open(e);
        }
    );
    this.$board.on('contextmenu',
        '.cell', function (e) {
            that._mark(e)
        }
    );

    $('.confirm').on('click', () => {
        $(this.$setting.children(".size").children("input")).attr("disabled", false);
        $('.setting').hide()
        $('.mine-body').show()

        const level = {
            mineTotal: Number(this.$setting.children(".mine").children("input")[0].value),
            size: [Number(this.$setting.children(".size").children("input")[0].value),
            Number(this.$setting.children(".size").children("input")[1].value)]
        };
        this.level = level
        this.reset();
    });

    $('.setting').children(".levels").on('click', 'button', function () {
        that.updateipnut($(this).attr('data-level'));
    });
    $('.reset').on('click', 'button', () => this.reset());
    $('.back').on('click', 'button', () => {
        $('.setting').show()
        $('.mine-body').hide()
    })
};

Minesweeper.prototype.updateipnut = function (level) {
    const setting = this.$setting, Setting = this.Setting;
    let size = [$(setting.children(".size").children("input")[0]), $(setting.children(".size").children("input")[1])],
        totalMine = $(setting.children(".mine").children("input")[0])
    if (level == "custom") {
        size[0].attr("disabled", false);
        size[1].attr("disabled", false);
        totalMine.attr("disabled", false);
        size[0][0].value = 8
        size[1][0].value = 8
        totalMine[0].value = 8
    } else {
        size[0].attr("disabled", true);
        size[1].attr("disabled", true);
        totalMine.attr("disabled", true);
        size[0][0].value = Setting[level].size[0]
        size[1][0].value = Setting[level].size[0]
        totalMine[0].value = Setting[level].mineTotal
    }
};

var Minesweeper = new Minesweeper;
Minesweeper.init();