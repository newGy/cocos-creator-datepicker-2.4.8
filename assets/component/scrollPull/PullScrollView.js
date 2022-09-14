/* jshint esversion:6 */

cc.Class({
    extends: cc.Component,

    properties: {},

    onLoad () {
        this.scrollView = this.node.getComponent(cc.ScrollView);
        if(this.scrollView){
            this.content = this.scrollView.content;
        }
    },

    // 兼容ListViewNew时初始化执行
    initForListView(jsListView) {
        this.jsListView = jsListView;
        this.scrollView = jsListView.scrollView;
        this.content = jsListView.scrollView.content;
    },

    initAnim (_topPull, _downPull) {
        if(_topPull && !this.topLoading) {
            this.topLoading = true;
            cc.loader.loadRes("pfPullTopAnim", cc.Prefab, (errorMessage, prefab) => {
                let pullTopAnim = cc.instantiate(prefab);
                this.content.parent.addChild(pullTopAnim, 0);
                let jsPullTopAnim = pullTopAnim.getComponent("jsPullTopAnim");
                this.pullTopAnim = pullTopAnim;
                this.jsPullTopAnim = jsPullTopAnim;
            });
        }
        if(_downPull && !this.downLoading){
            this.downLoading = true;
            cc.loader.loadRes("pfPullDownAnim", cc.Prefab, (errorMessage, prefab) => {
                let pullAnim = cc.instantiate(prefab);
                this.content.parent.addChild(pullAnim, cc.macro.MAX_ZINDEX);
                let jsPullDownAnim = pullAnim.getComponent("jsPullDownAnim");
                this.pullAnim = pullAnim;
                this.jsPullDownAnim = jsPullDownAnim;
            });
        }
    },

    refreshView (_topPullCallFunc, _downPullCallFunc) {
        this.initAnim(_topPullCallFunc, _downPullCallFunc);
        this.topPullCallFunc = _topPullCallFunc;
        this.downPullCallFunc= _downPullCallFunc;
        // this.scheduleOnce(()=>{ // 延迟一帧让Widget对齐
        this.startContentHeight = this.content.height;
        this.startContentY = this.startContentY || this.content.y;
        // }, 1/30);
    },

    downPullUpdate() {
        if (this.downPullCallFunc) {
            this.downPullCallFunc();
        }
    },

    topPullUpdate() {
        if (this.topPullCallFunc) {
            this.topPullCallFunc();
        }
    },

    update () {
        if (!this.scrollView || !this.startContentHeight) {
            return;
        }

        let offsetY = this.scrollView.getScrollOffset().y;
        let viewHeight = this.content.parent.height;
        let contentHeight = this.content.height;
        let topPullH = (offsetY+viewHeight) - contentHeight;
        let isTouching = this.scrollView.isScrolling();
        
        if (this.pullTopAnim && Math.ceil(offsetY) < 0) {
            if (isTouching) {
                this.showAction = Math.abs(offsetY) > 100;
            } else {
                if (this.showAction) {
                    this.scrollView.stopAutoScroll();
                    this.showAction = false;
                    this.playing = true;
                    this.pullTopAnim.y = viewHeight/2 - 45;
                    this.jsPullTopAnim.show();
                    this.jsPullTopAnim.play(()=>{
                        this.playing = false;
                        this.jsPullTopAnim.hide();
                        this.scrollView.scrollToTop();
                        this.topPullUpdate();
                    });
                } else if (!this.playing) {
                    this.jsPullTopAnim.hide();
                } else if (this.playing) {
                    this.scrollView.stopAutoScroll();
                    this.content.y = this.startContentY - 100;
                }
            }
        } else if (this.pullAnim && topPullH >= 0) {
            if (isTouching) {
                this.pullAnim.y = topPullH > 60 ? -viewHeight/2 + 60 - 30 : -viewHeight/2 + topPullH - 30;
                this.showAction = topPullH > 120;
                if (topPullH > 60) {
                    this.jsPullDownAnim.pulldownUpdate(topPullH);
                }
            } else {
                if (this.showAction) {
                    this.showAction = false;
                    this.playing = true;
                    this.content.height = this.startContentHeight + 90;
                    this.setListViewUpdate(false);
                    this.scrollView.stopAutoScroll();
                    this.scrollView.scrollToBottom(0);
                    this.jsPullDownAnim.loosenAnim(()=>{
                        this.playing = false;
                        this.content.height = this.startContentHeight;
                        this.scrollView.stopAutoScroll();
                        this.scrollView.scrollToBottom(0);
                        this.setListViewUpdate(true);
                        this.downPullUpdate();
                    });
                } else if (!this.playing) {
                    this.jsPullDownAnim.cleanScale();
                    this.pullAnim.y = -viewHeight/2 + topPullH - 30;
                }
            }
        }
    },

    setListViewUpdate(switchKey) {
        if(this.jsListView){
            this.jsListView.initialled = switchKey;
        }
    },
});
