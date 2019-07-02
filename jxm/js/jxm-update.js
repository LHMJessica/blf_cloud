//自动版本更新处理方法
(function ($) {
	// 保存设备信息，后台推送消息时需要用到
	$.saveDevInfo = function() {
		var cinfo = plus.push.getClientInfo();
		var params = "funid=login_event&eventcode=saveinfo";
		params += "&device_info="+JSON.stringify(plus.device);
		params += "&os_info="+JSON.stringify(plus.os);
		params += "&os_name="+plus.os.name.toLowerCase();
		params += "&run_info="+JSON.stringify(plus.runtime);
		params += "&push_info="+JSON.stringify(cinfo);
		params += "&push_cid="+cinfo.clientid;
		params += "&user_code="+jxm.getSession().user_code;
		
		jxm.post(params, null, {hasmask:false});
	};
	
	//检查最新版本信息
	$.checkVersion = function(force){
		if (!force) {//先判断是否强制更新；在判断是否自动更新
			var is_update = $.getSession().app_isupdate;
			if (!is_update || is_update != '1') return;
		}
		
		var hdcall = function(data) {
			var v = data.update_version;
			//说明没有新版本
 			if(!v || v.length == 0) return;
			$.updateVersion(data);
 		};
 		var params = 'funid=app_update&eventcode=getUpdatInfo';
 		plus.runtime.getProperty( plus.runtime.appid, function ( news ) {
			params += '&version='+news.version;
			params += '&os_type=' + (plus.os.name == 'Android'?'1':'0');
			params += '&appid='+ news.appid;
			jxm.post(params,hdcall,{hasmask:false});
		});
	};
	
	//自动更新版本
	$.updateVersion = function(obj){
		var update_type = obj.update_type;
 		var os_type = obj.os_type;
 		var update_note = obj.update_note||'有版本，请尽快升级！';
 		var update_title = obj.update_title;
 		var down_url = obj.down_url;
 		var update_version = obj.update_version;
 		if (!update_title || update_title.length == 0) {
 			update_title = '发现新版本：' + update_version;
 		}
   		
		var update = function() {
			if(update_type == '0'){
				if(os_type == '0'){
					console.log("ios整包安装");
					//ios整包安装
					plus.runtime.openURL(down_url);
				}else {
					console.log("android整包安装");
					//android整包安装
					plus.nativeUI.showWaiting("正在下载文件...");
					plus.downloader.createDownload( down_url, {filename:"_doc/update/"}, function(d,status){
				        if ( status == 200 ) { 
				            console.log("下载成功："+d.filename);
				            plus.nativeUI.showWaiting("安装文件...");
						    plus.runtime.install(d.filename,{},function(){
						        plus.nativeUI.closeWaiting();
						        console.log("安装apk文件结束！");
						        plus.nativeUI.alert("安装结束！",function(){
						            plus.runtime.restart();
						        });
						    },function(e){
						        plus.nativeUI.closeWaiting();
						        console.log("安装文件失败["+e.code+"]："+e.message);
						        plus.nativeUI.alert("安装文件失败["+e.code+"]："+e.message);
						    });
				        } else {
				            console.log("下载apk失败！");
				            plus.nativeUI.alert("下载失败！");
				        }
				        plus.nativeUI.closeWaiting();
				    }).start();
				}
			} else if(update_type == '1') {
				console.log("差量安装");
				//差量安装
				plus.nativeUI.showWaiting("正在下载升级文件...");
				plus.downloader.createDownload( down_url, {filename:"_doc/update/"}, function(d,status){
			        if ( status == 200 ) { 
			            console.log("下载wgt成功："+d.filename);
			            plus.nativeUI.showWaiting("正在安装...");
					    plus.runtime.install(d.filename,{},function(){
					        plus.nativeUI.closeWaiting();
					        console.log("安装wgt结束！");
					        setTimeout(function () {
					        	mui.toast("更新完成，3秒后重启应用")
					        },1000*3);
					     	 /*plus.nativeUI.alert("升级完成！",function(){
					            alert("开始重启");
					            plus.runtime.restart();
					        });*/
					    },function(e){
					        plus.nativeUI.closeWaiting();
					        console.log("安装wgt文件失败["+e.code+"]："+e.message);
					        plus.nativeUI.alert("安装文件失败["+e.code+"]："+e.message);
					    });
			        } else {
			            console.log("下载wgt失败！");
			            plus.nativeUI.alert("下载失败！");
			        }
			        plus.nativeUI.closeWaiting();
			    }).start();
			}
		};
		//版本号中含-，说明是项目升级包，需要自动升级
		//if (update_version.indexOf('-') > 0) {
		//	update();
		//} else {
			plus.ui.confirm(update_note, function(event) {
				if (0 == event.index) update();
			}, update_title, ["立即更新", "取  消"]);
		//}
	};
	
	//比较功能版本信息，更新功能并保存json数据
	$.udpateFunJson = function(oldFunJson,newFunJson){
		var type = oldFunJson.bar_code;
		var oldPacks = oldFunJson.packs;
		var newPacks = newFunJson.packs;
		var newstr = JSON.stringify(newFunJson);
		//替换本地的功能json
		for(var i in oldPacks){
			var funs = oldPacks[i].funs;
			for(var j in funs){
				var item = funs[j];
				var appfunid = item.app_funid;
				var isShow = item.is_show;
				var str = '\"app_funid\":\"'+appfunid+'\"';
				var index = newstr.indexOf(str);
				if(isShow == "0" && index != -1 ){
				  	var headIndex = newstr.substring(0,index).lastIndexOf("{");
				    var tailIndex = newstr.substring(0,index).length+newstr.substring(index).indexOf("}");
				    var res = newstr.substring(headIndex,tailIndex); 
				    var showRes = '\"is_show\":\"'+isShow+'\"';
				    var replaceRes = res.replace('\"is_show\":\"1\"',showRes);
				    newstr = newstr.replace(res,replaceRes);
				}
			}
		}
		localStorage.setItem("cur_user_menu_"+type,newstr);
	};
	
	//保存功能的json数据到localStorage
	$.saveFunJson = function(record){
		for(var i  in record){
			if(i == 0){
				var item = record[i];
				var subFun = item.subFun;
				for(var j in subFun){
					var parentFun = subFun[j];
					var code = parentFun.parentFun;
					localStorage.setItem("cur_user_fun2_"+code,JSON.stringify(parentFun.fun));
				}
				continue;
			}
			var item = record[i];
			var key = item.bar_code;
			if(key == 'bus'|| key == 'oa'){
				var data = localStorage.getItem("cur_user_menu_"+key);
				if(data == null){
					localStorage.setItem('cur_user_menu_'+key,JSON.stringify(item));
				}else{
					data = JSON.parse(data);
					$.udpateFunJson(data,item);
				}
			}
		}
	};
	
	// 取最新的后台授权功能列表，并重新加载业务与办公模块的功能列表
	$.updateRoleFun = function() {
		var hdcall = function(data){
			var record = data.funInfo||[];
			
			//保存功能的json数据到localStorage
			$.saveFunJson(record);
			
			//检查更新功能版本
			if (record.length > 0) {
				$.checkVersion(true);
			}
			
			//更新业务栏目的功能列表
			var buswin = plus.webview.getWebviewById("bus-main");
			if (buswin) mui.fire(buswin, 'refresh', null);
			//更新办公栏目的功能列表
			var oawin = plus.webview.getWebviewById("oa-main");
			if (oawin) mui.fire(oawin, 'refresh', null);
		}
		var params = "funid=app_role_fun&eventcode=queryFun";
		jxm.post(params,hdcall,{hasmask:false});
	};
	
	//============================应用包更新==============================
	//检查应用包的版本信息，如果发现新版本给出提示信息，由用户到升级界面中手工升级
	$.checkPackage = function() {
		var is_update = $.getSession().app_isuppack;
			if (!is_update || is_update != '1') return;
		
		//格式： {'pack_code':{auto_up:xx, pack_version:xx}, 'pack_code':{}, ...}
		var pinfo = localStorage.getItem("cur_user_packvns");
		if(pinfo == null){
			pinfo = {};
		}else{
			pinfo = JSON.parse(pinfo);
		}
		
		//数据格式： [{pack_id:xx, pack_code:xx, auto_up:xx, pack_path:xx, pack_version:xx, pack_url:xx},...]
		var hdcall = function(data) {
			if(!data || data.length == 0) return;
			
			for (var i = 0; i < data.length; i++) {
				var ds = data[i];
				
				var pcode = ds.pack_code;
				var isauto = ds.auto_up;
				var pv = pinfo[pcode];
				if (pv) {
					var vn = pv.pack_version;
					var vnn = ds.pack_version;
					//有新版本号，且自动升级
					if (vn < vnn) {
						pinfo[pcode] = ds;
						if (isauto == '1') {$.updatePackage(ds);}
					}
				} else {
					pinfo[pcode] = ds;
					if (isauto == '1') {$.updatePackage(ds);}
				}
			}
			
 		};
 		var params = 'funid=app_package&eventcode=packvno';
 		jxm.post(params,hdcall,{hasmask:false});
	};
	//业务包升级：下载升级文件、然后删除原文件、再解压文件
	//obj格式： {pack_id:xx, pack_code:xx, auto_up:xx, pack_path:xx, pack_version:xx, pack_url:xx}
	$.updatePackage = function(obj) {
		plus.nativeUI.showWaiting("正在下载["+obj.pack_name+" "+obj.pack_version+"]业务包...");
		plus.downloader.createDownload( obj.pack_url, {filename:"_doc/package/"}, 
			function(d, status){
	        if ( status == 200 ) {
	            console.log("下载业务包成功："+d.filename);
	            plus.nativeUI.showWaiting("正在解压...");
	            plus.zip.decompress( d.filename, obj.pack_path, 
	            	function(){
				        plus.nativeUI.closeWaiting();
				        console.log("解压业务包结束！");
			    	},
			    	function(e){
			        	plus.nativeUI.closeWaiting();
			        	console.log("解压业务包失败["+e.code+"]："+e.message);
			        	plus.nativeUI.alert("解压业务包失败["+e.code+"]："+e.message);
			    	});
	        } else {
	            console.log("下载业务包失败！");
	            plus.nativeUI.alert("下载业务包失败！");
	        }
	        plus.nativeUI.closeWaiting();
	    }).start();
	};
	
	//============================后台推送消息统一监听接口==============================
	// 后台推送消息统一监听接口；提供hdcall，方便在具体某个页面监听，而不需要修改通用方法
	$.pushListener = function(hdcall){
		var fn = function( msg , type) {
			//alert(type+'='+JSON.stringify(msg));

			var pushtype = null, pushdata = null;
			if ( msg.payload ) {
				if ( typeof(msg.payload)=="string" ) {
					var p = JSON.parse(msg.payload);
					if (p) {
						pushtype = p.pushtype;
						pushdata = p;
					}
				} else {
					pushtype = msg.payload.pushtype;
					pushdata = msg.payload;
				}
				//ios离线时还需要继续解析
				if (typeof(pushtype) == "undefined") {
					var pay = msg.payload.payload;
					if ( typeof(pay)=="string" ) {
						var p = JSON.parse(pay);
						if (p) {
							pushtype = p.pushtype;
							pushdata = p;
						}
					} else {
						pushtype = pay.pushtype;
						pushdata = pay;
					}
				}
			}
			if (pushtype) {
				var fn = hdcall ? hdcall : $.exePush;
				fn(pushdata);
			}
		};
		//消息格式：{pushtype:’xxx’, data:{xxxx}}
		plus.push.addEventListener( "receive", function(msg){fn(msg, 'receive');}, false );
		plus.push.addEventListener( "click", function(msg){fn(msg, 'click');}, false );
	};
	
	//执行推送消息数据请求，格式如：{pushtype:’xxx’, data:{xxxx}}
	$.exePush = function(json) {
		if (!json || !json.data) {
			mui.alert('非法格式的推送数据：'+json+'；必须是：{pushtype:xx, data:{xx}}');
			return;
		}
		if (json.pushtype == 'updateNum') {
			//更新审批消息数量，data格式如：{checknum:5}
			var imwin = plus.webview.getWebviewById("im-main");
			mui.fire(imwin, 'updateNum', json.data);
		} else if (json.pushtype == 'updateRole') {
			//更新角色功能配置，重新从后台取功能分配信息
			$.updateRoleFun();
		} else if (json.pushtype == 'updateApp') {
			//更新项目文件升级包
			$.checkVersion();
		}
	};
	
	
return $;
})(jxm);