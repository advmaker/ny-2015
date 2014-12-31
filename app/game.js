function WalkingCat(options)
{
    var
        _init = function(cat){
            cat.changeState(cat.STATIC_STATE)
                .$cat.css({
                    "display": 'none'
                    , "position": 'absolute'
                    , "width": cat.options.width
                    , "height": cat.options.height
                    , "z-index": cat.options.z
                })
                .appendTo('body');
            return cat;
        }
        , _distance = function(pointOne, pointTwo){
            return Math.sqrt(Math.pow(pointTwo.X - pointOne.X, 2) + Math.pow(pointTwo.Y - pointOne.Y, 2))
        }

        , cat = {
            STATIC_STATE: 0
            , WALKED_STATE: 1
            , RESENTFUL_STATE: 2
            , "options": {
                "src": {
                    "walked": 'assets/img/cat/walkingcat_transparent.gif',
                    "static": 'assets/img/cat/cat_walk.png',
                    "resentful": 'assets/cat/cat_slippers.png'
                }
                , "speed": 0.2
                , "width": 100
                , "height": 100
                , "z": 1002
            }
            , "$cat": $('<img src="">')
            , "state": null
            , onWalkedCallback: function(){}
            , changeState: function(state){
                if (state===this.state) { return this; }
                switch (state) {
                    case this.STATIC_STATE:
                        this.$cat.attr('src', this.options.src.static);
                        break;
                    case this.WALKED_STATE:
                        this.$cat.attr('src', this.options.src.walked);
                        break;
                    case this.RESENTFUL_STATE:
                        this.$cat.attr('src', this.options.src.resentful);
                        break;
                    default:
                        return this;
                        break;
                }
                this.state = state;
                return this;
            }
            , show: function(){
                this.$cat.show();
                return this;
            }
            , hide: function(){
                this.$cat.hide();
                return this;
            }
            , destroy: function(){
                this.$cat.remove();
                delete this;
            }
            , walkTo: function(position){
                var $that = this;
                this.changeState(this.WALKED_STATE)
                    .$cat.animate(
                    { top: position.Y , left: position.X }
                    , _distance(this.pos(), position) / this.options.speed
                    , 'linear'
                    , function(){ $that.changeState($that.STATIC_STATE); $that.onWalkedCallback(); }
                );
                return this;
            }
            , walk: function(fromPosition, toPosition){
                this.hide().teleport(fromPosition).show()
                    .walkTo(toPosition);
                return this;
            }
            , teleport: function(position){
                this.$cat.offset({top: position.Y, left: position.X});
                return this;
            }
            , stop: function(){
                this.$cat.stop(true);
                this.changeState(this.STATIC_STATE);
                return this;
            }
            , pos: function(){
                return {X: this.$cat.offset().left, Y: this.$cat.offset().top};
            }
            , onCached: function(callback){
                this.$cat.off('mousedown.WalkingCat').on('mousedown.WalkingCat', callback);
                return this;
            }
            , onWalked: function(callback){
                cat.onWalkedCallback = callback;
                return this;
            }
        }
    ;
    return _init(cat);
}

function Point(X, Y)
{
    return {
        "X": X
        , "Y": Y
        , modify: function(point){
            this.X += point.X;
            this.Y += point.Y;
            return this;
        }
        , clone: function(){
            return new Point(this.X, this.Y);
        }
    }
}

function Game()
{
    var
        _random_int = function(min, max){
            return Math.floor(Math.random() * (max - min)) + min;
        }
        , _init = function(game){
            var items = [];
            game.items.forEach(function(item){
                for (var i = 0; i<item.weight; i++) {
                    items.push(item);
                }
            });
            game.items = items;
            game.score = new GameScore(new Point(0, 0));
            game.timer = new Timer(
                game.difficulty.time.m
                , game.difficulty.time.s
                , {
                    "position": new Point(0, 25)
                    , "endTime": {"m":0, "s":0}
                }
            );
            game.timer.after = game.stop.bind(game);
            return game;
        }
        , game = {
            "score": 0
            , "timer": 0
            , "items": [
                {
                    "img": 'assets/img/items/tree.png'
                    , "worth": 10
                    , "weight": 1
                }
                , {
                    "img": 'assets/img/items/snowman.png'
                    , "worth": 5
                    , "weight": 7
                }
                , {
                    "img": 'assets/img/items/sock.png'
                    , "worth": 3
                    , "weight": 12
                }
                , {
                    "img": 'assets/img/items/star.png'
                    , "worth": 1
                    , "weight": 40
                }
                , {
                    "img": 'assets/img/items/gift.png'
                    , "worth": 1
                    , "weight": 40
                }
            ]
            , "difficulty": {
                "tick": 1000
                , "itemLifeTime": 2000
                , "catResenting": 2000
                , "catPlanting": 500
                , "punishment": -20
                , "time": {
                    "m": 1
                    , "s": 0
                }
            }
            , "intervalID": null
            , createItem: function(position){
                var
                    itemData = this.items[Math.floor(Math.random()*this.items.length)]
                    , item = new GameItem($.extend({"position": position}, itemData))
                    ;
                window.setTimeout(this.missItem.bind(this, item), this.difficulty.itemLifeTime);
                item.$img.on('click.Game', this.cachedItem.bind(this, item));
            }
            , scoreUpdate: function(value, position){
                if (position) {
                    var scorePoint = new GamePoint(value, position);
                }
                this.score.update(value);
            }
            , cachedItem: function(item){
                this.scoreUpdate(
                    item.worth
                    , new Point(
                        item.position.X + item.$img.width()
                        , item.position.Y
                    )
                );
                item.cached(this.score.position);
            }
            , missItem: function(item){
                item.melt();
            }
            , phaseStart: function(){
                var
                    cat = new WalkingCat()
                    , points = {}
                    ;
                points.start = new Point(
                    $(window).width() - cat.$cat.width()
                    , _random_int(
                        $(window).scrollTop() + cat.$cat.height(),
                        $(window).height() + $(window).scrollTop() - cat.$cat.height()
                    )
                );
                points.end = new Point(
                    0 - cat.$cat.width()
                    , points.start.Y
                );
                points.plant = new Point(
                    _random_int(points.end.X, points.start.X)
                    , points.start.Y
                );
                cat
                    .teleport(points.start)
                    .show()
                    .onCached(this.phaseResent.bind(this, cat, points))
                ;
                this.phaseOne(cat, points);
            }
            , phaseOne: function(cat, points){
                cat
                    .walkTo(points.plant)
                    .onWalked(this.phasePlant.bind(this, cat, points))
                ;
            }
            , phasePlant: function(cat, points){
                cat.stop();
                this.createItem(points.plant.modify({X: -20, Y: 30}));
                window.setTimeout(this.phaseEnd.bind(this, cat, points), this.difficulty.catPlanting);
            }
            , phaseEnd: function(cat, points){
                cat
                    .walkTo(points.end)
                    .onWalked(function(){
                        cat.destroy();
                    });
            }
            , phaseResent: function(cat, points){
                this.scoreUpdate(
                    this.difficulty.punishment
                    , new Point(cat.pos().X + cat.$cat.width(), cat.pos().Y)
                );
                cat.stop().changeState(cat.RESENTFUL_STATE);
                window.setTimeout(this.phaseEnd.bind(this, cat, points), this.difficulty.catResenting);
            }
            , start: function(){
                this.intervalID = window.setInterval(this.phaseStart.bind(this), this.difficulty.tick);
                this.score.draw();
                this.timer.run();
            }
            , stop: function(){
                window.clearInterval(this.intervalID);
                this.after();
            }
            , after: function(){}
        }
    ;
    return _init(game);
}

function GameItem(options)
{
    var
        _init = function(item){
            item.worth = options.worth;
            item.position = options.position;
            item.$img = $('<img>')
                .attr('src', options.img)
                .css({
                    "position": 'absolute'
                    , "display": 'none'
                    , "z-index": 1001
                    , "cursor": 'pointer'
                })
                .appendTo('body')
            ;
            item.show();
            return item;
        }
        , item = {
            "position": null
            , "$img": null
            , "worth": 0
            , show: function(){
                this.$img
                    .css({
                        "left": this.position.X + 'px'
                        , "top": this.position.Y + 'px'
                    })
                    .fadeIn(800);
            }
            , melt: function(){
                var self = this;
                this.$img.fadeOut(1000, function(){
                    self.$img.remove();
                    self = null;
                });
                return this;
            }
            , stopMelting: function(){
                this.$img.stop();
                return this;
            }
            , cached: function(point){
                this
                    .stopMelting()
                    .$img.animate({
                        "width": 0
                        , "height": 0
                        , "left": point.X
                        , "top": point.Y
                    });
                return this;
            }
        }
    ;

    return _init(item);
}

function GamePoint(value, position)
{
    var
        _init = function(point){
            point.value = value;
            point.position = position;
            point.$label = $('<span>'+(value>0 ? '+' : '-')+Math.abs(value)+'</span>')
                .css({
                    "position": 'absolute'
                    , "display": 'none'
                    , "color": value > 0 ? point.colors.positive : point.colors.negative
                    , "left": position.X + "px"
                    , "top": position.Y + "px"
                    , "font-weight": 'bold'
                    , "font-size": '18px'
                })
                .appendTo('body')
            ;
            point.show();
            return point;
        }
        , point = {
            "colors": {
                "positive": '#2ECC40'
                , "negative": '#FF4136'
            }
            , "value": 0
            , "position": null
            , "$label": null
            , show: function(){
                this.$label.fadeIn('slow', this.hide.bind(this));
            }
            , hide: function(){
                this.$label.fadeOut('slow', this.destroy.bind(this));
            }
            , destroy: function(){
                this.$label.remove();
                delete this;
            }
        }
    ;
    return _init(point);
}

function Timer(m, s, options)
{
    var
        _init = function(timer){
            timer.position = options.position;
            timer.endTime = options.endTime || null;
            timer.time.m = m;
            timer.time.s = s;
            timer.$display = $('<span></span>')
                .css({
                    "position": 'absolute'
                    , "z-index": 1000
                    , "left": options.position.X+'px'
                    , "top": options.position.Y+'px'
                    , "color": 'black'
                    , "font-weight": 'bold'
                    , "font-size": '24px'
                    , "background-color": 'white'
                })
                .appendTo('body')
                .show()
            ;
            return timer;
        }
        , timer = {
            "$display": null
            , "label": 'Time:&nbsp;'
            , "time": {
                "m": 0
                , "s": 0
            }
            , "endTime": null
            , "intervalID": 0
            , tick: function(){
                this.time.s -= 1;
                if (this.isOut()) {
                    return;
                }
                if (this.time.s <= 0) {
                    this.time.s = 59;
                    this.time.m -= 1;
                }
                this.draw();
            }
            , run: function(){
                this.intervalID = window.setInterval(this.tick.bind(this), 1000);
            }
            , pause: function(){

            }
            , after: function(){}
            , isOut: function(){
                if (!this.endTime) {
                    console.log('1');
                    return false;
                }
                if (
                    this.time.m===this.endTime.m
                    && this.time.s===this.endTime.s
                ){
                    window.clearInterval(this.intervalID);
                    this.after();
                    return true;
                }
                return false;
            }
            , draw: function(){
                this.$display.html(
                    this.label
                    + this.time.m
                    + '&nbsp;:&nbsp;'
                    + ('00' + this.time.s).substr(2)
                );
            }
        }
    ;
    return _init(timer);
}

function GameScore(position)
{
    var
        _init = function(score){
            score.position = position;
            score.$display = $('<span></span>')
                .css({
                    "position": 'absolute'
                    , "z-index": 1000
                    , "left": position.X+'px'
                    , "top": position.Y+'px'
                    , "color": 'black'
                    , "font-weight": 'bold'
                    , "font-size": '24px'
                    , "background-color": 'white'
                })
                .appendTo('body')
                .show()
            ;
            return score;
        }
        , score = {
            "$display": null
            , "label": 'Score:&nbsp;'
            , "value": 0
            , position: null
            , update: function(value){
                this.value += value;
                this.draw();
            }
            , draw: function(){
                this.$display.html(this.label + this.value);
            }
        }
    ;
    return _init(score);
}

function GreetingCard()
{
    var
        _init = function(card){
            card.$core = $('div')
                .css({
                    "position": 'absolute'
                    , "left": 0
                    , "top": 0
                    , "height": '100%'
                    , "width": '100%'
                    , "background-size": 'cover'
                    , "background-image": 'url('+card.background+')'
                    , 'z-index': 1009
                })
                .appendTo('body')
                .show()
            ;
            return card;
        }
        , card = {
            "background": '/assets/img/ny/ny_wall.jpg'
            , "$core": null
        }
    ;
    return _init(card)
}
