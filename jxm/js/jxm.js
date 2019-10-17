/*!
 * =====================================================
 * Jxm v1.0.0 (http://jxstar.com)
 * Copyright 2016 Guangzhou Donghong Software Technology Inc.
 * =====================================================
 */
/**
 * JXM 核心JS 
 * 
 * @author TonyTan
 * @version 1.0, 2016-01-01
 */
var jxm = (function(document, mui) {

	//默认提供取dom对象的方法
	var $ = function(id) {
		return document.getElementById(id);
	};

	//当前应用服务器地址
	$.SERVER_URL = 'http://120.78.227.30/blf_cloud';
	//Jxstar-IM的注册信息
	$.IM_APPID = '8a216da85aac13ff015ab6f6b42604ed';
	$.IM_APPTOKEN = 'b840540005635000fd10182d93526665';

	//取服务器地址
	$.getURL = function(check) {
		var url = localStorage.getItem("server_url");
		if(!url || url.length == 0) {
			url = $.SERVER_URL;
		}
		url += (!check) ? "/fileAction.do" : "/commonAction.do";
		return url;
	};
	var appendQuery = function(url, query) {
		if(query === '') {
			return url;
		}
		return(url + '&' + query).replace(/[&?]{1,2}/, '?');
	};

	//把时间戳 YYYYMMddHHmmss 解析为日期或时间
	$.shortTime = function(ts, isbr) {
		if(!ts || ts.length < 14) return ts;
		if(ts.indexOf('-') > -1) {
			var re = /[-: ]/g;
			ts = ts.replace(re, '');
		}

		var cur = $.getTimeStamp();
		//如果是当天的时间，则只显示HH:mm，否则显示日期
		if(cur.substr(0, 8) == ts.substr(0, 8)) {
			return '今天' + (isbr ? '<br>' : ' ') + ts.substr(8, 2) + ':' + ts.substr(10, 2);
		} else {
			return ts.substr(4, 2) + '-' + ts.substr(6, 2) + (isbr ? '<br>' : ' ') + ts.substr(8, 2) + ':' + ts.substr(10, 2); //不要年份：ts.substr(0, 4)+'-'+
		}
	};
	$.formatDate = function(date, format) {
		if(format == "" || format == undefined || format == null) {
			format = 'yyyy-MM-dd';
		}
		let o = {
			"M+": date.getMonth() + 1,
			"d+": date.getDate(),
			"H+": date.getHours(),
			"m+": date.getMinutes(),
			"s+": date.getSeconds(),
			"q+": Math.floor((date.getMonth() + 3) / 3), //季度
			"f+": date.getMilliseconds(), //毫秒
		};
		if(/(y+)/.test(format))
			format = format.replace(RegExp.$1, date.getFullYear() + "").substr(4 - RegExp.$1.length);
		for(let k in o) {
			if(new RegExp("(" + k + ")").test(format))
				format = format.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
		}
		return format;
	}
	/**
	 * 获取当前时间戳 YYYYMMddHHmmss
	 * 
	 * @returns 
	 */
	$.getTimeStamp = function() {
		var now = new Date();
		var timestamp = now.getFullYear() + '' +
			((now.getMonth() + 1) >= 10 ? "" + (now.getMonth() + 1) : "0" +
				(now.getMonth() + 1)) +
			(now.getDate() >= 10 ? now.getDate() : "0" +
				now.getDate()) +
			(now.getHours() >= 10 ? now.getHours() : "0" +
				now.getHours()) +
			(now.getMinutes() >= 10 ? now.getMinutes() : "0" +
				now.getMinutes()) +
			(now.getSeconds() >= 10 ? now.getSeconds() : "0" +
				now.getSeconds());
		return timestamp;
	};

	//参照ytx photo.make 的方法改写
	$.makeBlob = function(data, type, fileName) {
		var bin = atob(data.split(",")[1]);
		var buffer = new Uint8Array(bin.length);
		for(var i = 0; i < bin.length; i++) {
			buffer[i] = bin.charCodeAt(i)
		}
		var blob = new Blob([buffer.buffer], {
			type: type //audio/amr;image/jpeg
		});

		blob.url = window.URL.createObjectURL(blob);

		blob.fileName = fileName;
		return blob
	};

	$.open = function(id, opts) {
		var sets = {
			url: id,
			id: id,
			show: {
				aniShow: 'pop-in',
				duration: 100
			},
			styles: {
				scalable: true
			}
		};
		mui.extend(sets, opts, true);
		return mui.openWindow(sets);
	};
	$.bbsurl = function(keyid) {
		var url = jxm.getURL() + "?funid=sys_attach&pagetype=editgrid&eventcode=down&nousercheck=1&dataType=byte&keyid=" + keyid;
		var dtask = plus.downloader.createDownload(url, {
			method: "GET"
		}, function(d, status) {
			if(status == 200) {
				plus.runtime.openFile(d.filename, {}, function(e) {
					mui.alert("无法打开此文件：" + e.emssage, "我的软件");
				});
			} else {
				mui.alert("下载失败");
			}
		});
		dtask.start();
		console.log(url);
	};
	//ajax请求
	$.post = function(params, hdcall, options) {
		var t1 = (new Date()).getTime();

		var me = this,
			mask;
		if(!params) params = "";

		var tenantid = "",
			usertoken = "";
		var cur_user = localStorage.getItem('cur_user');
		if(cur_user && cur_user.length > 0) {
			var data = JSON.parse(cur_user);
			if(params.indexOf("&user_id=") < 0) {
				params += '&user_id=' + data.user_id;
			}
			tenantid = data.tenant_id || '';
			usertoken = data.user_token || '';
		}
		var headers = {
			"tenantid": tenantid,
			"usertoken": usertoken
		};
		if(params.indexOf("&nousercheck") >= 0) {
			headers = null;
		}

		options = options || {};
		var timeout = options.timeout || 30 * 1000;
		var dataType = options.type || 'json'; //xml json
		var async = (options.async == null ? true : options.async); //true 为异步请求
		var hasmask = (options.hasmask == null ? true : options.hasmask); //是否需要遮挡层
		var hashint = (options.hashint == null ? false : options.hashint); //是否需要提示信息
		var serverurl = (options.serverurl == null ? $.getURL(true) : options.serverurl); //支持设置指定的服务器路径

		if(hasmask) {
			if(window.plus) {
				mask = plus.nativeUI.showWaiting();
			}
		}

		console.log("jxm.post url:" + serverurl);
		console.log("jxm.post params:" + params);

		var success = function(result) {
			var t2 = (new Date()).getTime();
			console.log("jxm.post use time:" + (t2 - t1));

			//调整执行顺序，先销除myMask对象，再调用回调函数
			if(mask) {
				mask.close();
				mask = null;
			}

			if(result.success == true || result.success == 'true') {
				var msg = result.message;
				if(hashint) {
					if(msg.length == 0) msg = '执行成功！';
					mui.toast(msg);
				}

				//成功执行外部的回调函数
				if(hdcall != null) hdcall(result.data, result.extData);
			} else {
				$.loadhint();
				//如果注册了执行失败的回调函数，则不提示失败消息
				if(options && options.errorcall) {
					options.errorcall(result);
					if(window.plus) plus.nativeUI.closeWaiting();
				} else {
					if(window.plus) plus.nativeUI.closeWaiting();
					var msg = result.message;
					if(msg.length == 0) msg = '执行失败！';
					mui.toast(msg);
					if(msg.indexOf('没有登录') >= 0) {
						var url = localStorage.getItem("server_url");
						//清楚所有本地数据，只保留服务器地址信息
						localStorage.clear();
						if(url && url.length > 0) {
							localStorage.setItem("server_url", url);
						}
						if(window.plus) {
							var wm = plus.webview.getLaunchWebview();
							wm.loadURL("/index.html");
							var ws = plus.webview.all();
							mui.each(ws, function(i, obj) {
								if(obj.id != wm.id) {
									obj.close();
								}
							});
						}

					}
				}

			}
		};
		mui.ajax(serverurl, {
			data: params,
			dataType: dataType,
			type: 'post',
			timeout: timeout,
			headers: headers,
			success: success,
			error: function(xhr, type, errorThrown) {
				if(mask) {
					mask.close();
					mask = null;
				}
				$.loadhint();

				var msg = '';
				//"timeout", "error", "abort", "parsererror"、"null"
				if(type == 'parsererror') {
					msg = '返回JSON格式不正确！';
					//处理部分外部系统返回JSON不规范的问题
					if(serverurl.indexOf('fileAction.do') > 0) {
						var result = xhr.responseText;
						try {
							result = window.eval("(" + result + ")");
						} catch(e) {
							mui.toast(msg);
						}
						success(result);
						return;
					} else {
						mui.toast(msg);
					}
				} else {
					msg = '连接服务器失败！type=' + type + '; status=' + xhr.status + '; error=' + errorThrown;
				}
				if(options && options.errorcall) {
					options.errorcall({
						message: msg
					});
				} else {
					mui.toast(msg);
				}
			}
		});
	};

	//跨域GET请求
	$.jsonp = {
		requestCount: 0,
		requests: {},
		timeout: 30000,
		callbackKey: 'callback',
		request: function(options) {
			options = options || {};
			var me = this,
				id = ++me.requestCount,
				timeout = options.timeout ? options.timeout : me.timeout,
				callbackName = options.callbackName || 'callback' + id,
				callbackKey = options.callbackKey || me.callbackKey,
				data = options.data || '',
				url = options.url,
				request,
				script;

			if(typeof data !== "string") {
				data = mui.param(data);
			}

			if(callbackName.length > 0) {
				data += '&' + callbackName + '=' + callbackName;
			}
			data += '&' + callbackKey + '=jxm.jsonp.' + callbackName;
			if(data.length > 0) data += '&';
			data += '_dc=' + (new Date().getTime());

			var src = appendQuery(url, data);
			//console.log('src='+src);

			script = document.createElement('script');
			script.type = 'text/javascript';
			script.src = src;

			me.requests[id] = request = {
				url: url,
				data: data,
				script: script,
				id: id,
				scope: options.scope,
				success: options.success,
				failure: options.failure,
				callback: options.callback,
				callbackName: callbackName
			};

			if(timeout > 0) {
				request.timeout = setTimeout(function() {
					me.handleTimeout.apply(me, [request]);
				}, timeout);
			}

			me.setupErrorHandling(request);
			//此方法什么时候调用，后台BO方法执行完成后反馈的js中执行
			me[callbackName] = function(result) {
				me.handleResponse.apply(me, [result, request]);
			};

			document.head.appendChild(script);

			return request;
		},
		abort: function(request) {
			var requests = this.requests,
				key;

			if(request) {
				if(!request.id) {
					request = requests[request];
				}
				this.abort(request);
			} else {
				for(key in requests) {
					if(requests.hasOwnProperty(key)) {
						this.abort(requests[key]);
					}
				}
			}
		},
		handleAbort: function(request) {
			request.errorType = 'abort';
			this.handleResponse(null, request);
		},
		handleError: function(request) {
			request.errorType = 'error';
			this.handleResponse(null, request);
		},
		handleTimeout: function(request) {
			request.errorType = 'timeout';
			this.handleResponse(null, request);
		},
		setupErrorHandling: function(request) {
			var me = this;
			request.script.onerror = function(e) {
				me.handleError.apply(me, [request, e]);
			};
		},
		cleanupErrorHandling: function(request) {
			request.script.onerror = null;
		},
		handleResponse: function(result, request) {
			var success = true;

			if(request.timeout) {
				clearTimeout(request.timeout);
			}
			delete this[request.callbackName];
			delete this.requests[request.id];
			this.cleanupErrorHandling(request);

			document.head.removeChild(request.script);
			delete request.script;

			if(request.errorType) {
				success = false;
				if(request.failure)
					request.failure.apply(request.scope, [request.errorType]);
			} else {
				if(request.success)
					request.success.apply(request.scope, [result]);
			}
			request.callback.apply(request.scope, [success, result, request.errorType]);
		}
	};

	$.confirm = function(msg, cb) {
		var btnArray = ['确认', '取消'];
		mui.confirm(msg, '确认', btnArray, function(e) {
			if(e.index == 0) {
				cb.call();
			}
		});
	};

	//返回时避免关闭窗口
	$.back = function(hide, ws) {
		if(window.plus) {
			ws || (ws = plus.webview.currentWebview());

			if(hide == null) hide = true;
			if(hide || ws.preate) {
				ws.hide('auto');
			} else {
				ws.close('auto');
			}
		} else if(history.length > 1) {
			history.back();
		} else {
			window.close();
		}
	};

	//显示加载中提示
	$.loadhint = function(target, showed) {
		var loader = document.querySelector(".mui-loader");
		if(!loader) return;

		if(showed) {
			if(target) target.classList.remove('mui-hidden');
			loader.classList.add('mui-hidden');
		} else {
			if(target) target.classList.add('mui-hidden');
			loader.classList.remove('mui-hidden');
			loader.innerHTML = '没有数据';
		}
	};

	//压缩图片处理
	$.compressImage = function(path, successCB, errorCB, options) {
		var opts = {
			src: path,
			dst: path,
			overwrite: true,
			width: '20%',
			height: '20%',
			quality: 100
		};
		if(options) {
			mui.extend(opts, options);
		}
		errorCB = errorCB || function(e) {
			console.log('compress image error!');
		};

		plus.zip.compressImage(opts, successCB, errorCB);
	};
	/* *上传附件参数：
		attach_path: datafile
		funid: sys_attach
		attach_name: 文件名称
		attach_field: 空
		dataid: 1001
		datafunid: sys_dept
		eventcode: create
		user_id: administrator
		回调方法：cb
	 * */
	$.uploadFile = function(params, cb) {
		console.log('..........uploadFile params=' + JSON.stringify(params));

		var task = plus.uploader.createUpload($.getURL(), {
				method: "POST",
				timeout: 10000
			},
			function(t, status) {
				console.log('update file responseText=' + t.responseText);
				// 上传完成
				if(status == 200) {
					var result = JSON.parse(t.responseText);
					if(result.success && cb) {
						cb();
					} else {
						mui.toast(result.message);
					}
				} else {
					mui.toast('upload file error!');
				}
			}
		);

		task.addFile(params.attach_path, {
			key: "attach_path"
		});
		task.addData("funid", "sys_attach");
		task.addData("eventcode", "create");
		task.addData("nousercheck", "1");
		task.addData("attach_name", params.attach_name);
		task.addData("attach_field", params.attach_field || '');
		task.addData("dataid", params.dataid);
		task.addData("datafunid", params.datafunid);
		var cur_user = localStorage.getItem('cur_user');
		if(cur_user && cur_user.length > 0) {
			var data = JSON.parse(cur_user);
			task.addData("user_id", data.user_id);
		} else {
			task.addData("user_id", 'administrator');
		}
		task.start();
	};

	/* *上传更新附件参数：
		attach_path: datafile
		funid: sys_attach
		attach_name: 文件名称
		attach_field: 空
		dataid: 1001
		datafunid: sys_dept
		eventcode: fcreate
		user_id: administrator
		回调方法：cb
	 * */
	$.fuploadFile = function(params, cb) {
		console.log('..........uploadFile params=' + JSON.stringify(params));

		var task = plus.uploader.createUpload($.getURL(), {
				method: "POST",
				timeout: 10000
			},
			function(t, status) {
				console.log('update file responseText=' + t.responseText);
				// 上传完成
				if(status == 200) {
					var result = JSON.parse(t.responseText);
					if(result.success && cb) {
						cb();
					} else {
						mui.toast(result.message);
					}
				} else {
					mui.toast('upload file error!');
				}
			}
		);

		task.addFile(params.attach_path, {
			key: params.fieldname
		});
		task.addData("funid", "sys_attach");
		task.addData("eventcode", params.eventcode);
		task.addData("nousercheck", "1");
		task.addData("table_name", params.table_name);
		task.addData("attach_name", params.attach_name);
		task.addData("attach_field", params.attach_field || '');
		task.addData("dataid", params.dataid);
		task.addData("image_small_use", params.image_small_use || '0');
		task.addData("image_small_size", params.image_small_size || '600');
		task.addData("datafunid", params.datafunid);
		var cur_user = localStorage.getItem('cur_user');
		if(cur_user && cur_user.length > 0) {
			var data = JSON.parse(cur_user);
			task.addData("user_id", data.user_id);
		} else {
			task.addData("user_id", 'administrator');
		}
		task.start();
	};

	//批量更新评分控件
	$.starMore = function(container) {
		var nodes = container.querySelectorAll('div.jxm-star-small');
		console.log('...........nodes.length=' + nodes.length);
		for(var i = 0, n = nodes.length; i < n; i++) {
			var num = nodes[i].getAttribute('data-num');
			console.log('...........nodes[' + i + ']=' + num);
			if(!num || num < 0) num = 0;
			for(var j = 0; j < 5; j++) {
				var d = document.createElement('i');
				var c = (j < num) ? '-filled red' : '';
				d.setAttribute('class', 'mui-icon mui-icon-star' + c);
				d.setAttribute('index', j);
				nodes[i].appendChild(d);
			}
		}
	};

	//评分控件
	$.starUI = function(container, num, isedit) {
		//初始化星级控件
		var init = function() {
			if(!num || num < 0) num = 0;
			for(var i = 0; i < 5; i++) {
				var d = document.createElement('i');
				var c = (i < num) ? '-filled red' : '';
				d.setAttribute('class', 'mui-icon mui-icon-star' + c);
				d.setAttribute('index', i);
				container.appendChild(d);

				if(isedit) {
					d.addEventListener('tap', function(e) {
						var index = parseInt(this.getAttribute('index'));
						setNum(index);
					});
				}
			}
		};

		//设置几星
		var setNum = function(index) {
			console.log('set num:' + index);
			var ds = container.querySelectorAll('i');
			for(var j = 0; j < 5; j++) {
				var cs = (j <= index) ? '-filled red' : '';
				if(ds[j]) ds[j].setAttribute('class', 'mui-icon mui-icon-star' + cs);
			}
		};

		init();

		return {
			//取值：几星
			getNum: function() {
				var is = container.querySelectorAll('i.mui-icon-star-filled');
				return is.length;
			},
			//设置：几星
			setNum: function(num) {
				setNum(num);
			}
		};
	};

	//自动打开软键盘
	$.openKeyboard = function() {
		if(mui.os.ios) {
			var webview = plus.webview.currentWebview().nativeInstanceObject();
			webview.plusCallMethod({
				"setKeyboardDisplayRequiresUserAction": false
			});
		} else {
			var Context = plus.android.importClass("android.content.Context");
			var InputMethodManager = plus.android.importClass("android.view.inputmethod.InputMethodManager");
			var main = plus.android.runtimeMainActivity();
			var imm = main.getSystemService(Context.INPUT_METHOD_SERVICE);
			imm.toggleSoftInput(0, InputMethodManager.SHOW_FORCED);
		}
	};

	//回到指定的主界面，有四个选项值:im\bus\oa\set
	$.backHome = function(tab) {
		var wn = plus.webview.all();
		console.log('window total size=' + wn.length);
		for(var i = 0; i < wn.length; i++) {
			if(wn[i].id.indexOf('.html') >= 0) {
				wn[i].hide();
			}
		}
		var home = plus.webview.getLaunchWebview();
		mui.fire(home, 'showTab', {
			tabid: tab
		});
	};

	//取会话信息
	$.getSession = function() {
		var session = localStorage.getItem('cur_user');
		return JSON.parse(session);
	};

	//取人员头像
	$.getPhotoURL = function(imcode, vno) {
		if(imcode == 'self') {
			var session = $.getSession();
			imcode = session['im_user_code'];
		}

		var name = 'avatar',
			i = '',
			url = '';
		var photoObj = localStorage.getItem('im_photo_' + imcode);
		var params = 'funid=sys_attach&eventcode=photo_att_id&im_user_code=' + imcode;
		var hdcall = function(data) {
			if(data.attachId && data.attachId.length > 0) {
				var downUrl = jxm.getURL() + '?funid=sys_attach&eventcode=downPhoto&keyid=' + data.attachId;
				downUrl += '&dataType=byte&image_small_use=1&image_small_size=120&nousercheck=1&dc=' + (new Date()).getTime();
				var downMe = plus.downloader.createDownload(downUrl, {
					filename: '_doc/photo/'
				}, function(d, status) {
					// 下载完成
					if(status == 200) {
						console.log("Download success: " + d.filename);
						var objUrl = plus.io.convertLocalFileSystemURL(d.filename);
						var objVno = vno;
						if(objUrl.indexOf('?funid=sys_attach') == -1) {
							localStorage.setItem('im_photo_' + imcode, objUrl + ',' + objVno);
							return url;
						}
					} else {
						console.log("Download failed: " + status);
					}
				});
				downMe.start();
			}
		};

		/*
		if(photoObj == null||photoObj.length == 0){
			jxm.post(params, hdcall);
			localStorage.setItem('im_photo_'+imcode,',0');
		}else{
			var photos = photoObj.split(',');
			var purl = photos[0], pno = photos[1];
			if (vno && (vno != pno) && (pno != '0')) {
				jxm.post(params, hdcall);
			} 
			if (purl.length > 0) return purl;
		}*/
		//调用缺省的头像
		if(imcode) {
			i = imcode.charAt(imcode.length - 1);
			if(isNaN(i)) {
				i = imcode.charCodeAt(imcode.length - 1) % 5;
			}
		}
		url = '../../jxm/img/photo/' + name + i + '.png';
		return url;
	};
	//检查是否有动态节点或自由节点，如果有则返回相应的数据，没有返回“”;
	$.checkDynUser = function(funid, dataid) {
		var params = "funid=wf_free_user&eventcode=checkDynUser&fun_id=" + funid + "&data_id=" + dataid;
		jxm.post(params, function(data) {
			return data;
		});
	};
	//处理type="datetime-local"控件的日期时间值的格式问题
	$.dealDateTime = function(value) {
		if(!value || value.length == 0) return value;

		if(value.indexOf('T') >= 0) {
			value = value.replace("T", " ");
		}
		if(value.indexOf('.') >= 0) { //ios
			value = value.split('.')[0];
		}
		var r = value.match(/:/g);
		if(!r || r.length == 0) {
			value += '00:00:00';
		} else if(r.length == 1) {
			value += ':00';
		}

		return value;
	};

	//根据文件类型取图片url
	$.fileTypeImg = function(type) {
		var imgPath = '';
		if(type.indexOf('word') > -1 || type.indexOf('doc') > -1) {
			imgPath = '../../jxm/img/file_type/docx.png';
		} else if(type.indexOf('excel') > -1 || type.indexOf('sheet') > -1 || type.indexOf('xls') > -1) {
			imgPath = '../../jxm/img/file_type/xlsx.png';
		} else if(type.indexOf('pdf') > -1) {
			imgPath = '../../jxm/img/file_type/pdf.png';
		} else if(type.indexOf('ppt') > -1 || type.indexOf('powerpoint') > -1) {
			imgPath = '../../jxm/img/file_type/pptx.png';
		} else if(type.indexOf('zip') > -1 || type.indexOf('octet-stream') > -1 || type.indexOf('rar') > -1) {
			imgPath = '../../jxm/img/file_type/rar.png';
		} else if(type.indexOf('text') > -1 || type.indexOf('ini') > -1 || type.indexOf('txt') > -1) {
			imgPath = '../../jxm/img/file_type/text.png';
		} else if(type.indexOf('image') > -1 || type.indexOf('jpg') > -1 || type.indexOf('png') > -1) {
			imgPath = '../../jxm/img/file_type/jpeg.png';
		} else {
			imgPath = '../../jxm/img/file_type/text.png';
		}
		return imgPath;
	};

	//打开远程文件
	$.openRemoteFile = function(url) {
		var wait = plus.nativeUI.showWaiting("正在打开文件...");
		var dtask = plus.downloader.createDownload(url, {
			method: "GET"
		}, function(d, status) {
			if(status == 200) {
				plus.runtime.openFile(d.filename, {}, function(e) {
					wait.close();
					mui.alert("无法打开此文件", "我的软件");
				});
				wait.close();
			} else {
				wait.close();
				mui.alert("文件打开失败", "我的软件");
			}
		});
		dtask.start();
	};

	$.getUrlParam = function(name) {
		var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
		var r = window.location.search.substr(1).match(reg);
		if(r != null) {
			return unescape(r[2]);
		} else {
			return '';
		}
	};

	$.audits = {
		"0": "未提交",
		"1": "已提交",
		"2": "审批中",
		"3": "已审批",
		"4": "已否决",
		"6": "已退回",
		"7": "已注销"
	};

	//是否在微信中打开
	$.isWX = function() {
		var ua = navigator.userAgent.toLowerCase();
		var iswx = ua.indexOf('micromessenger') != -1;
		return iswx;
	};

	//微信下面把标题栏隐藏掉
	if($.isWX()) {
		document.body.onload = function() {
			var d = document.body.getElementsByTagName('header')[0];
			if(d) {
				var t = document.body.querySelectorAll('h1.mui-title')[0];
				if(t && t.innerText.length > 0 && document.title.length == 0) {
					document.title = t.innerText;
				}
				d.remove();
			}
		};
	}

	return $;
})(document, mui);