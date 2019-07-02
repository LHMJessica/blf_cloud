/**
 * Created by petter on 15/11/28.
 */

var win = $(window),
    scrollAreaEl = $('.t_r_content'),
    leftFreezeEl = $('.t_l_freeze'),
    leftTableEl = leftFreezeEl.find('table'),
    rightTableEl = $('.t_r_t table');

//动态计算容器最大高度
function adjustHeight() {
    var winHeight = win.height(),
        tableHeight = winHeight - 90;
    leftFreezeEl.height(tableHeight);
    scrollAreaEl.height(tableHeight);
}

adjustHeight();
win.on('resize', adjustHeight);

//设置iscroll
var myScroll = new IScroll('.t_r_content', {
    scrollX: true,
    scrollY: true,
    probeType: 3
});

//阻止默认滚动
scrollAreaEl.on('touchmove mousewheel', function(e) {
    e.preventDefault();
});

//固定上左表头的滚动
myScroll.on('scroll', updatePosition);
myScroll.on('scrollEnd', updatePosition);

function updatePosition() {
    var a = this.y;
    var b = this.x;
    leftTableEl.css('transform', 'translate(0px, ' + a + 'px) translateZ(0px)');
    rightTableEl.css('transform', 'translate(' + b + 'px, 0px) translateZ(0px)');
}
//给日期原型添加格式化
Date.prototype.format = function(fmt) { 
     var o = { 
        "M+" : this.getMonth()+1,                 //月份 
        "d+" : this.getDate(),                    //日 
        "h+" : this.getHours(),                   //小时 
        "m+" : this.getMinutes(),                 //分 
        "s+" : this.getSeconds(),                 //秒 
        "q+" : Math.floor((this.getMonth()+3)/3), //季度 
        "S"  : this.getMilliseconds()             //毫秒 
    }; 
    if(/(y+)/.test(fmt)) {
            fmt=fmt.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length)); 
    }
     for(var k in o) {
        if(new RegExp("("+ k +")").test(fmt)){
             fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));
         }
     }
    return fmt; 
}