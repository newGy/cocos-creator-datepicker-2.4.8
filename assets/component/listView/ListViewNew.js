/* jshint esversion:6 */

/**
 * 仅调用一次
 * @param content 錨點需要設置為0.5；
 * @param item 需要繼承ListViewItemNew；
 */

cc.Class
({
    extends: cc.Component,

    properties: {
        scrollView: cc.ScrollView,
        itemPrefab: cc.Prefab,//item预制体 预制挂的脚本要继承ListViewItem
        direction: cc.Float  = 1,  //1代表豎屏
        spawnCount: cc.Float = 0, // 实际创建的项数量

        spacingY: cc.Float  = 0, // 纵向间隔
        spacingX: cc.Float  = 0, // 横向间隔

        itemHeight: cc.Float  = 0, // item的高度
        itemWidth: cc.Float  = 0, // item的高度
        colNum: cc.Float  = 1, // 纵向布局时的列数
        rowNum: cc.Float  = 1, // 横向布局时的行数
        // 兼容上下拉刷新
        isPullUpdate : {
            default: false,
            tooltip: "是否打开上拉、下拉刷新",
        },
        topUpdateCallback: {
            default: null,
            type: cc.Component.EventHandler,
            tooltip: "顶部下拉刷新回调事件，不传默认关闭下拉刷新",
            visible: function() {
                return this.isPullUpdate;
            }
        },
        downUpdateCallback: {
            default: null,
            type: cc.Component.EventHandler,
            tooltip: "底部上拉刷新回调事件，不传默认关闭上拉刷新",
            visible: function() {
                return this.isPullUpdate;
            }
        },
    },
    
    onLoad() {

    },

    /**
     * 仅调用一次
     * @param list 列表数据
     * @param obj 额外数据
     */
    init(list, obj) {
        if (this.initialled) {
            return;
        }
        this.DirectionVertical = 1; //1為豎屏 其他為橫屏
        this.initialled = false;
        this.obj = obj;
        this.dataList = list || [];
        this.totalCount = this.dataList.length;
        this.itemList = [];// 存储实际创建的项数组
        this.content = this.scrollView.content;
        this.updateTimer = 0;
        this.updateInterval = 0.05;
        this.lastContentPosY = 0; // 使用这个变量来判断滚动操作是向上还是向下
        this.lastContentPosX = 0;
        this.lastContentPosyPageLoad = 0; //这个属性是特殊场景上用，加载更多的最后恢复的位置（在上拉过程中会重置lastContentPosY，所有不准确）
        // 设定缓冲矩形的大小为实际创建项的高度累加，当某项超出缓冲矩形时，则更新该项的显示内容
        this.bufferZoneY = Math.ceil(this.spawnCount / this.colNum) * (this.itemHeight + this.spacingY) / 2;
        // 设定缓冲矩形的大小为实际创建项的宽度累加，当某项超出缓冲矩形时，则更新该项的显示内容
        this.bufferZoneX = Math.ceil(this.spawnCount / this.rowNum) * (this.itemWidth + this.spacingX) / 2;
        this.initialize();
        this.initialled = true;
        this.callBack = null;
        this.addPullScrollComp();
    },

    // 添加上下拉刷新组件
    addPullScrollComp() {
        if(this.isPullUpdate){
            let PullScrollView = require("PullScrollView");
            this.jsPullScroll = this.node.addComponent(PullScrollView);
            this.jsPullScroll.initForListView(this);
        }
    },

    // 高度改变时更新上下拉的高度
    refreshPullUpdate(){
        if(this.jsPullScroll){
            this.jsPullScroll.refreshView(
                ()=>{this.topUpdateCallback.emit();}, 
                ()=>{this.downUpdateCallback.emit();}
            );
        }
    },

    removeAllItems() {
        for (const key in this.itemList) {
            if (this.itemList[key]) {
                this.itemList[key] = null;
            }
        }
        this.itemList = [];
        if (this.content) {
            this.content.removeAllChildren();
        }
    },

    // 列表初始化
    initialize() {
        // 获取整个列表的高度
        if (this.direction ==  this.DirectionVertical) {
            this.content.height = Math.ceil(this.totalCount / this.colNum) * (this.itemHeight + this.spacingY) + this.spacingY;
            for (let i = 0; i < this.spawnCount; ++i) { // spawn items, we only need to do this once
                let item = cc.instantiate(this.itemPrefab);
                this.content.addChild(item);
                item.active = true;
                //设置该item的坐标（注意父节点content的Anchor坐标是(0.5, 1)，所以item的y坐标总是负值）
                let row = Math.floor(i / this.colNum);
                let col = i % this.colNum;
                let x = (this.itemWidth + this.spacingX) * (-(this.colNum - 1) * 0.5 + col);
                item.setPosition(x, -this.itemHeight * (0.5 + row) - this.spacingY * (row + 1));
                item.getComponent("ListViewItemNew").index = i;
                item.getComponent("ListViewItemNew").updateItem(i, this.dataList[i], this.obj);
                this.itemList.push(item);
            }
        } else {
            this.content.width = Math.ceil(this.totalCount / this.rowNum) * (this.itemWidth + this.spacingX) + this.spacingX;
            for (let i = 0; i < this.spawnCount; ++i) { // spawn items, we only need to do this once
                let item = cc.instantiate(this.itemPrefab);
                this.content.addChild(item);
                item.active = true;
                // 设置该item的坐标（注意父节点content的Anchor坐标是(0, 0.5)，所以item的x坐标总是正值）
                let col = Math.floor(i / this.rowNum);
                let row = i % this.rowNum;
                let y = (this.itemHeight + this.spacingY) * ((this.rowNum - 1) * 0.5 - row);
                item.setPosition(this.itemWidth * (0.5 + col) + this.spacingX * (col + 1), y);
                item.getComponent("ListViewItemNew").index = i;
                item.getComponent("ListViewItemNew").updateItem(i, this.dataList[i], this.obj);
                this.itemList.push(item);
            }
        }

    },

    // 返回item在ScrollView空间的坐标值
    getPositionInView(item) {
        if(cc.isValid(item) && cc.isValid(item.parent)) {
            let worldPos = item.parent.convertToWorldSpaceAR(item.position);
            let viewPos = this.scrollView.node.convertToNodeSpaceAR(worldPos);
            return viewPos;
        }
    },

    // 每帧调用一次。根据滚动位置动态更新item的坐标和显示(所以spawnCount可以比totalCount少很多)
    update(dt) {
        if (!this.initialled) {
            return;
        }
        this.updateTimer += dt;
        if (this.updateTimer < this.updateInterval || (this.itemList && this.itemList.length <= 0)) {
            // console.log("updateTimer ========return");
            return; // 我们不需要每帧都做计算
        }
        this.updateTimer = 0;
        let items = this.itemList;

        if (this.direction == this.DirectionVertical) {
            // 如果当前content的y坐标小于上次记录值，则代表往下滚动，否则往上。
            let isDown = this.content.y < this.lastContentPosY;
            // 实际创建项占了多高（即它们的高度累加）
            let offset = (this.itemHeight + this.spacingY) * Math.ceil(this.spawnCount / this.colNum);
            let newY = 0;

            // 遍历数组，更新item的位置和显示
            for (let i = 0; i < items.length; ++i) {
                let viewPos = this.getPositionInView(items[i]);
                if (isDown) {
                    // 提前计算出该item的新的y坐标
                    newY = items[i].y + offset;
                    // 如果往下滚动时item已经超出缓冲矩形，且newY未超出content上边界，
                    // 则更新item的坐标（即上移了一个offset的位置），同时更新item的显示内容
                    if (viewPos.y < -this.bufferZoneY && newY < 0) {
                        items[i].y = newY;
                        let itemComp = items[i].getComponent("ListViewItemNew");
                        let index = itemComp.index - items.length; // 更新index及数据下标
                        itemComp.index = index;
                        itemComp.updateItem(index, this.dataList[index], this.obj);
                    }
                } else {
                    // 提前计算出该item的新的y坐标
                    newY = items[i].y - offset;
                    // 如果往上滚动时item已经超出缓冲矩形，且newY未超出content下边界，
                    // 则更新item的坐标（即下移了一个offset的位置），同时更新item的显示内容
                    if (viewPos.y > this.bufferZoneY && newY > -this.content.height) {
                        items[i].y = newY;
                        let itemComp = items[i].getComponent("ListViewItemNew");
                        let index = itemComp.index + items.length; // 更新index及数据下标
                        itemComp.index = index;
                        itemComp.updateItem(index, this.dataList[index], this.obj);
                        this.lastContentPosyPageLoad = this.content.y
                    }
                }
            }
            // 更新lastContentPosY和总项数显示
            this.lastContentPosY = this.content.y;
        } else {
            // 如果当前content的x坐标小于上次记录值，则代表往左滚动，否则往右。
            let isLeft = this.content.x < this.lastContentPosX;
            // 实际创建项占了多高（即它们的宽度累加）
            let offset = (this.itemWidth + this.spacingX) * Math.ceil(this.spawnCount / this.rowNum);
            let newX = 0;
            // 遍历数组，更新item的位置和显示
            for (let i = 0; i < items.length; ++i) {
                let viewPos = this.getPositionInView(items[i]);
                if (isLeft) {
                    // 提前计算出该item的新的y坐标
                    newX = items[i].x + offset;
                    // 如果往左滚动时item已经超出缓冲矩形，且newX未超出content右边界，
                    // 则更新item的坐标（即右移了一个offset的位置），同时更新item的显示内容
                    if (viewPos.x < -this.bufferZoneX && newX < this.content.width) {
                        items[i].x = newX;
                        let itemComp = items[i].getComponent("ListViewItemNew");
                        let index = itemComp.index + items.length; // 更新index及数据下标
                        itemComp.index = index;
                        itemComp.updateItem(index, this.dataList[index], this.obj);
                    }
                } else {
                    // 提前计算出该item的新的y坐标
                    newX = items[i].x - offset;
                    // 如果往右滚动时item已经超出缓冲矩形，且newY未超出content左边界，
                    // 则更新item的坐标（即左移了一个offset的位置），同时更新item的显示内容
                    if (viewPos.x > this.bufferZoneX && newX > 0) {
                        items[i].x = newX;
                        let itemComp = items[i].getComponent("ListViewItemNew");
                        let index = itemComp.index - items.length; // 更新index及数据下标
                        itemComp.index = index;
                        itemComp.updateItem(index, this.dataList[index], this.obj);
                    }
                }
            }
            // 更新lastContentPosY和总项数显示
            this.lastContentPosX = this.content.x;
        }

    },

    //更新列表内数据
    updateData(list, isSplitLoad, notScrollToTop) {
        this.dataList = list;
        let NotScrollToTop = this.dataList && this.dataList.length > this.spawnCount;
        this.scrollView.stopAutoScroll();
        if (isSplitLoad) {
            this.updateDataAndSplitLoad(this.dataList);
            return;
        }
        // 
        if (this.direction == this.DirectionVertical) {
            if (!notScrollToTop || !NotScrollToTop) this.scrollView.scrollToTop();
            for (let i = 0; i < this.itemList.length; i++) {
                let row = Math.floor(i / this.colNum);
                this.itemList[i].y = -this.itemHeight * (0.5 + row) - this.spacingY * (row + 1);
                let itemComp = this.itemList[i].getComponent("ListViewItemNew");
                let data = this.dataList[i];
                itemComp.index = i;
                itemComp.updateItem(i, data, this.obj);
            }
            this.content.height = Math.ceil(this.dataList.length / this.colNum) * (this.itemHeight + this.spacingY) + this.spacingY;
        } else {
            if (!notScrollToTop || !NotScrollToTop) this.scrollView.scrollToLeft();
            for (let i = 0; i < this.itemList.length; i++) {
                let col = Math.floor(i / this.rowNum);
                this.itemList[i].x = this.itemWidth * (0.5 + col) + this.spacingX * (col + 1);
                let itemComp = this.itemList[i].getComponent("ListViewItemNew");
                let data = this.dataList[i];
                itemComp.index = i;
                itemComp.updateItem(i, data, this.obj);
            }
            this.content.width = Math.ceil(this.dataList.length / this.rowNum) * (this.itemWidth + this.spacingX) + this.spacingX;
        }

        this.updateHeightForData();
    },

    updateDataNoChangeIndex(list) {
        if (!list || list.length <= 0) {
            this.dataList.content.x = 0;
            return;
        }
        this.dataList = list;
        for (let i = 0; i < this.itemList.length; i++) {
            let itemComp = this.itemList[i].getComponent("ListViewItemNew");
            let data = this.dataList[itemComp.index];
            itemComp.updateItem(itemComp.index, data, list);
        }
        this.content.width = Math.ceil(this.dataList.length / this.rowNum) * (this.itemWidth + this.spacingX) + this.spacingX;
    },

    // 更新列表内数据,分帧加载。
    updateDataAndSplitLoad(list) {
        this.initialled = false;
        this.dataList = list;
        this.scrollView.stopAutoScroll();
        if (this.callBack) {
            this.unschedule(this.callBack);
        }
        if (this.direction == this.DirectionVertical) {
            let i = 0;
            this.scrollView.scrollToTop();
            this.content.height = 0;
            this.callBack = () => {
                if (i >= this.itemList.length || !cc.isValid(this.content)) {
                    this.unschedule(this.callBack);
                    this.callBack = null;
                    this.initialled = true;
                    if (this.content) this.content.height = Math.ceil(this.dataList.length / this.colNum) * (this.itemHeight + this.spacingY) + this.spacingY;
                    return;
                }
                let row = Math.floor(i / this.colNum);
                this.itemList[i].y = -this.itemHeight * (0.5 + row) - this.spacingY * (row + 1);
                let itemComp = this.itemList[i].getComponent("ListViewItemNew");
                let data = this.dataList[i];
                itemComp.index = i;
                itemComp.updateItem(i, data, this.obj);
                i++;
            };
        } else {
            let i = 0;
            this.scrollView.scrollToLeft();
            this.content.width = 0;
            this.callBack = () => {
                if (i >= this.itemList.length || !cc.isValid(this.content)) {
                    this.unschedule(this.callBack);
                    this.callBack = null;
                    this.initialled = true;
                    if (this.content) this.content.width = Math.ceil(this.dataList.length / this.rowNum) * (this.itemWidth + this.spacingX) + this.spacingX;
                    return;
                }
                let col = Math.floor(i / this.rowNum);
                this.itemList[i].x = this.itemWidth * (0.5 + col) + this.spacingX * (col + 1);
                let itemComp = this.itemList[i].getComponent("ListViewItemNew");
                itemComp.index = i;
                let data = this.dataList[i];
                itemComp.updateItem(i, data, this.obj);
                i++;
            };
        }

        this.schedule(this.callBack, 0.02, cc.macro.REPEAT_FOREVER);
    },

    updateHeightForData(data){
        if(data){
            this.dataList = data;
        }
        if(this.dataList){
            let length = this.dataList.length;
            if(this.direction == this.DirectionVertical){
                // 计算真实高度
                this.content.height = Math.ceil(length / this.colNum) * (this.itemHeight + this.spacingY) + this.spacingY;
                // 设置最小高度，使其能滚动
                let viewHeight = this.content.parent.height;
                if(this.content.height < viewHeight){
                    this.content.height = viewHeight;
                }
            }else{
                // 计算真实宽度
                this.content.width = Math.ceil(length / this.rowNum) * (this.itemWidth + this.spacingX) + this.spacingX;
                // 设置最小宽度，使其能滚动
                let viewWidth = this.content.parent.width;
                if(this.content.width < viewWidth){
                    this.content.width = viewWidth;
                }
            }
        }

        this.refreshPullUpdate();
    },

    onDestroy() {
        //clearInterval(this.IntervalId);
    }
});
