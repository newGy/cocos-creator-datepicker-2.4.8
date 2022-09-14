let ListViewItemNew = require('ListViewItemNew');
cc.Class({
    extends: ListViewItemNew,
    properties: {
        labNum : cc.Label
    },
    
    onLoad(){
    },

    onClickedItem() {
        
    },

    updateItem(index, itemData, obj) {
        this.parentView = obj;
        if (itemData == undefined) {
            this.node.active = false;
            return;
        }
        
        this.index = index;
        this.node.active = true;
        this.labNum.string = itemData;
    },
});
