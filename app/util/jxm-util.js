
(function ($) {
	//设置选择功能，如：selectData('select-account', "../util/select-account.html", 'account_name', 'account_id');
	$.selectData = function(e, href, fname, fid, fcode){
		document.getElementById(fname).addEventListener('tap', function(){
			var param = {callbackWinId:mui.currentWebview.id, callbackEvent:e};
			jxm.open(href,{extras:{selectParams:param}});
  		});
  		var fc = document.getElementById(fcode);
  		window.addEventListener(e, function(event){
			var obj = event.detail;
			document.getElementById(fname).value = obj.dataname;
			if (fc) fc.value = obj.datacode;
			document.getElementById(fid).value = obj.dataid;
			
		});
		document.getElementById(fname).addEventListener('change', function(){
			if (this.value.length == 0) {
				if (fc) fc.value = '';
				document.getElementById(fid).value = '';
			}
		});
	},
  		
	//返回下拉选项的显示值
    $.getComboText = function(combo, value) {
		if (!combo || combo == null) {
			return '';
		}
		var text = '';
		mui.each(combo, function(n, c){
			if (value == c.value) {
				text = c.text;
				return text;
			}
		});
		return text;
	};
	//获取当前部门Id
	$.getDeptId = function(){
		var json = localStorage.getItem('cur_user');
		var data = JSON.parse(json);
		var deptId = '';
		if (data) deptId = data.dept_id;
		return deptId;
	}
	//获取当前部门名
	$.getDeptName = function(){
		var json = localStorage.getItem('cur_user');
		var data = JSON.parse(json);
		var DeptName = '';
		if (data) DeptName = data.dept_name;
		return DeptName;
	}
	//获取当前用户ID
	$.getUserId = function() {
		var json = localStorage.getItem('cur_user');
		var data = JSON.parse(json);
		var userId = '';
		if (data) userId = data.user_id;
		return userId;
	};
	
	//获取当前用户编号
	$.getUserCode = function() {
		var json = localStorage.getItem('cur_user');
		var data = JSON.parse(json);
		var userCode = '';
		if (data) userCode = data.user_code;
		return userCode;
	};
	
	//获取当前用户姓名
	$.getUserName = function() {
		var json = localStorage.getItem('cur_user');
		var data = JSON.parse(json);
		var userName = '';
		if (data) userName = data.user_name;
		return userName;
	};
	
	
	/**
	* 取当前日期, 格式：yyyy-mm-dd
	*/
	$.getToday = function(inc){
		var now = new Date();
       
        var year = now.getFullYear();       //年
        var month = now.getMonth() + 1;     //月
        var day = now.getDate();            //日
        if (inc != null) {
        	day = day + inc;
        }
       
        var clock = year + "-";
        if(month < 10)
            clock += "0";
        clock += month + "-";
        if(day < 10)
            clock += "0";
        clock += day;
        
        return(clock); 
	};
	
	/**
	* 取当前日期时间, 格式：yyyy-mm-dd HH:mm:ss
	*/
	$.getTodayTime = function(){
		var now = new Date();
       
        var hh = now.getHours();            //时
        var mm = now.getMinutes();          //分
        var ss = now.getSeconds();          //秒
       
        var clock = this.getToday();
        clock += " ";
        if(hh < 10)
            clock += "0";
        clock += hh + ":";
        if (mm < 10) clock += '0'; 
        clock += mm + ":";
        if (ss < 10) clock += '0'; 
        clock += ss; 
        
        return(clock); 
	};
	
return $;
})(jxm);