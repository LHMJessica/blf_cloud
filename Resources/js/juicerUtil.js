/*
 * 自定义js类
 *  部分方法依赖DCLOUD
 * @author PSL
 * @version 1.0, 2018-12-18
 */
var toJson = function(str) {
	return JSON.stringify(str);
};
var yesNo = function(str){
	return str=="0"?"否":"是";
};
var isNum = function(str){
	if(str=='' || str==undefined){
		return '0';
	}else{
		return str;
	}
};
var isNull = function(str){
	if(str=='' || str.length==0){
		return '无';
	}else{
		return str;
	}
};
var isColor = function(str){
	if(str=='' || str==undefined || parseInt(str)==0){
		return 'background-color:red';
	}else{
		return '';
	}
};
var Excp_type = function(str){
	str =  parseInt(str);
	var val = "";
	switch (str){
		case 0:
		    val = "待办";
			break;
		case 1:
		    val = "待处理";
			break;
		case 2:
		    val = "已完成";
			break;	
	}
	return val;
};
juicer.set('cache', false);
juicer.set('errorhandling', false);
juicer.set('strip', true);
juicer.set('detection', false);
juicer.register('yesNo', yesNo);//注册自定义函数
juicer.register('toJson', toJson); //注册自定义函数
juicer.register('isNum', isNum); //注册自定义函数
juicer.register('isNull', isNull); //注册自定义函数
juicer.register('isColor', isColor); //注册自定义函数
juicer.register("Excp_type",Excp_type);//异常类型
