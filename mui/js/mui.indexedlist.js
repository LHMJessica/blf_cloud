/**
 * IndexedList
 * 类似联系人应用中的联系人列表，可以按首字母分组
 * 右侧的字母定位工具条，可以快速定位列表位置
 * varstion 1.0.0
 * by Houfeng
 * Houfeng@DCloud.io
 **/

(function($, window, document) {

	var classSelector = function(name) {
		return '.' + $.className(name);
	}

	var IndexedList = $.IndexedList = $.Class.extend({
		/**
		 * 通过 element 和 options 构造 IndexedList 实例
		 **/
		init: function(holder, options) {
			var self = this;
			self.options = options || {};
			self.box = holder;
			if(!self.box) {
				throw "实例 IndexedList 时需要指定 element";
			}
			self.createDom();
			self.findElements();
			self.caleLayout();
			self.bindEvent();
		},
		createDom: function() {
			var self = this;
			self.el = self.el || {};
			//styleForSearch 用于搜索，此方式能在数据较多时获取很好的性能
			self.el.styleForSearch = document.createElement('style');
			(document.head || document.body).appendChild(self.el.styleForSearch);
		},
		findElements: function() {
			var self = this;
			self.el = self.el || {};
			self.el.search = self.box.querySelector(classSelector('indexed-list-search'));
			self.el.searchInput = self.box.querySelector(classSelector('indexed-list-search-input'));
			self.el.searchClear = self.box.querySelector(classSelector('indexed-list-search') + ' ' + classSelector('icon-clear'));
			self.el.bar = self.box.querySelector(classSelector('indexed-list-bar'));
			self.el.barItems = [].slice.call(self.box.querySelectorAll(classSelector('indexed-list-bar') + ' a'));
			self.el.inner = self.box.querySelector(classSelector('indexed-list-inner'));
			self.el.items = [].slice.call(self.box.querySelectorAll(classSelector('indexed-list-item')));
			self.el.liArray = [].slice.call(self.box.querySelectorAll(classSelector('indexed-list-inner') + ' li'));
			self.el.alert = self.box.querySelector(classSelector('indexed-list-alert'));
		},
		caleLayout: function() {
			var self = this;
			var withoutSearchHeight = (self.box.offsetHeight - self.el.search.offsetHeight) + 'px';
			//支持没有字母bar的效果
			if(!self.el.bar) {
				self.el.inner.style.height = withoutSearchHeight;
				return;
			}
			self.el.bar.style.height = withoutSearchHeight;
			self.el.inner.style.height = withoutSearchHeight;
			var barItemHeight = ((self.el.bar.offsetHeight - 40) / self.el.barItems.length) + 'px';
			self.el.barItems.forEach(function(item) {
				item.style.height = barItemHeight;
				item.style.lineHeight = barItemHeight;
			});
		},
		scrollTo: function(group) {
			var self = this;
			var groupElement = self.el.inner.querySelector('[data-group="' + group + '"]');
			if(!groupElement || (self.hiddenGroups && self.hiddenGroups.indexOf(groupElement) > -1)) {
				return;
			}
			self.el.inner.scrollTop = groupElement.offsetTop;
		},
		bindBarEvent: function() {
			var self = this;
			var pointElement = null;
			if(!self.el.bar) return; //支持没有字母bar的效果
			var findStart = function(event) {
				if(pointElement) {
					pointElement.classList.remove('active');
					pointElement = null;
				}
				self.el.bar.classList.add('active');
				var point = event.changedTouches ? event.changedTouches[0] : event;
				pointElement = document.elementFromPoint(point.pageX, point.pageY);
				if(pointElement) {
					var group = pointElement.innerText;
					if(group && group.length == 1) {
						pointElement.classList.add('active');
						self.el.alert.innerText = group;
						self.el.alert.classList.add('active');
						self.scrollTo(group);
					}
				}
				event.preventDefault();
			};
			var findEnd = function(event) {
				self.el.alert.classList.remove('active');
				self.el.bar.classList.remove('active');
				if(pointElement) {
					pointElement.classList.remove('active');
					pointElement = null;
				}
			};
			self.el.bar.addEventListener('touchmove', function(event) {
				findStart(event);
			}, false);
			self.el.bar.addEventListener('touchstart', function(event) {
				findStart(event);
			}, false);
			document.body.addEventListener('touchend', function(event) {
				findEnd(event);
			}, false);
			document.body.addEventListener('touchcancel', function(event) {
				findEnd(event);
			}, false);
		},
		search: function(keyword) {
			var self = this;
			keyword = (keyword || '').toLowerCase();
			var selectorBuffer = [];
			var groupIndex = -1;
			var itemCount = 0;
			var liArray = self.el.liArray;
			var itemTotal = liArray.length;
			self.hiddenGroups = [];
			var checkGroup = function(currentIndex, last) {
				if(itemCount >= currentIndex - groupIndex - (last ? 0 : 1)) {
					selectorBuffer.push(classSelector('indexed-list-inner li') + ':nth-child(' + (groupIndex + 1) + ')');
					self.hiddenGroups.push(liArray[groupIndex]);
				};
				groupIndex = currentIndex;
				itemCount = 0;
			}
			liArray.forEach(function(item) {
				var currentIndex = liArray.indexOf(item);
				if(item.classList.contains($.className('indexed-list-group'))) {
					checkGroup(currentIndex, false);
				} else {
					var text = (item.innerText || '').toLowerCase();
					var value = (item.getAttribute('data-value') || '').toLowerCase();
					var tags = (item.getAttribute('data-tags') || '').toLowerCase();
					if(keyword && text.indexOf(keyword) < 0 &&
						value.indexOf(keyword) < 0 &&
						tags.indexOf(keyword) < 0) {
						selectorBuffer.push(classSelector('indexed-list-inner li') + ':nth-child(' + (currentIndex + 1) + ')');
						itemCount++;
					}
					if(currentIndex >= itemTotal - 1) {
						checkGroup(currentIndex, true);
					}
				}
			});
			if(selectorBuffer.length >= itemTotal) {
				self.el.inner.classList.add('empty');
			} else if(selectorBuffer.length > 0) {
				self.el.inner.classList.remove('empty');
				self.el.styleForSearch.innerText = selectorBuffer.join(', ') + "{display:none;}";
			} else {
				self.el.inner.classList.remove('empty');
				self.el.styleForSearch.innerText = "";
			}
		},
		bindSearchEvent: function() {
			var self = this;
			self.el.searchInput.addEventListener('input', function() {
				var keyword = this.value;
				self.search(keyword);
			}, false);
			$(self.el.search).on('tap', classSelector('icon-clear'), function() {
				self.search('');
			}, false);
		},
		bindEvent: function() {
			var self = this;
			self.bindBarEvent();
			self.bindSearchEvent();
		},
		//add by Jessica.liu
		//全选事件
		checkAll: function() {
			var self = this;
			var done = document.getElementById("btn-select");
			var check = document.getElementById("checkAll");
			var dataList = document.getElementById("data-list");
			var clist = document.querySelectorAll("input[type=checkbox]");
			var flag = false;
			check.addEventListener('tap', function() {
				if(flag) {
					for(var i = 0; i < clist.length; i++) {
						clist[i].checked = false;
					}
					flag = false;
					this.innerHTML = "全选";
				} else {
					for(var i = 0; i < clist.length; i++) {
						clist[i].checked = true;
					}
					flag = true;
					this.innerHTML = "取消";
				}
				var checkboxArray = [].slice.call(dataList.querySelectorAll('input[type="checkbox"]:checked'));
				var objs = [];
				checkboxArray.forEach(function(box) {
					var item = box.parentNode;
					var dataid = item.id;
					var dataext = item.getAttribute("data-ext");
					var datacode = item.getAttribute("data-code");
					var dataname = item.getAttribute("data-name");
					var datadesc = item.querySelector('p').innerHTML;
					//取到选择的数据
					var obj = {
						dataid: dataid,
						dataext: dataext,
						datacode: datacode,
						dataname: dataname,
						datadesc: datadesc
					};
					objs.push(obj);
				});
				console.log('mutil select data:' + JSON.stringify(objs));

				//取选择窗口的回调参数
				var opts = self.options.selectParams;
				if(!opts.callbackWinId) {
					mui.alert('没有找到目标窗口对象！');
					return;
				}

				var targetWin = plus.webview.getWebviewById(opts.callbackWinId);
				mui.fire(targetWin, opts.callbackEvent, {
					selectdata: objs
				});
				//有些页面不需要返回，而且跳到新页面
				if(!opts.notback) mui.back();
			}, false);

			//改造后的控件，解决隐藏的list不能选择的问题
			var calheight = function(hidden) {
				//calc hieght
				self.box.style.height = (self.box.offsetHeight + (hidden ? 60 : -60)) + 'px';
			};
			mui('.mui-indexed-list-inner').on('change', 'input', function() {
				var count = dataList.querySelectorAll('input[type="checkbox"]:checked').length;
				var value = "已选(" + count + ")条, 确定";
				var footer = document.querySelector("footer");
				done.innerHTML = value;
				if(count) {
					if(footer.classList.contains("mui-hidden")) {
						footer.classList.remove("mui-hidden");
						calheight(false);
					}
				} else {
					if(!footer.classList.contains("mui-hidden")) {
						footer.classList.add("mui-hidden");
						calheight(true);
					}
				}
			});
		},
		//add by tony.tan
		//多选事件处理
		doMutilSelect: function() {
			var self = this;
			var done = document.getElementById("btn-select");
			var dataList = document.getElementById("data-list");

			done.addEventListener('tap', function() {
				var checkboxArray = [].slice.call(dataList.querySelectorAll('input[type="checkbox"]:checked'));
				var objs = [];
				checkboxArray.forEach(function(box) {
					var item = box.parentNode;
					var dataid = item.id;
					var dataext = item.getAttribute("data-ext");
					var datacode = item.getAttribute("data-code");
					var dataname = item.getAttribute("data-name");
					var datadesc = item.querySelector('p').innerHTML;
					//取到选择的数据
					var obj = {
						dataid: dataid,
						dataext: dataext,
						datacode: datacode,
						dataname: dataname,
						datadesc: datadesc
					};
					objs.push(obj);
				});
				console.log('mutil select data:' + JSON.stringify(objs));

				//取选择窗口的回调参数
				var opts = self.options.selectParams;
				if(!opts.callbackWinId) {
					mui.alert('没有找到目标窗口对象！');
					return;
				}

				var targetWin = plus.webview.getWebviewById(opts.callbackWinId);
				mui.fire(targetWin, opts.callbackEvent, {
					selectdata: objs
				});
				//有些页面不需要返回，而且跳到新页面
				if(!opts.notback) mui.back();
			}, false);

			//改造后的控件，解决隐藏的list不能选择的问题
			var calheight = function(hidden) {
				//calc hieght
				self.box.style.height = (self.box.offsetHeight + (hidden ? 60 : -60)) + 'px';
			};
			mui('.mui-indexed-list-inner').on('change', 'input', function() {
				var count = dataList.querySelectorAll('input[type="checkbox"]:checked').length;
				var value = "已选(" + count + ")条, 确定";
				var footer = document.querySelector("footer");
				done.innerHTML = value;
				if(count) {
					if(footer.classList.contains("mui-hidden")) {
						footer.classList.remove("mui-hidden");
						calheight(false);
					}
				} else {
					if(!footer.classList.contains("mui-hidden")) {
						footer.classList.add("mui-hidden");
						calheight(true);
					}
				}
			});
		},
		//单选事件处理
		doSingleSelect: function() {
			var self = this;

			mui("#data-list").on("tap", ".mui-table-view-cell", function(e) {
				var dataid = this.id;
				var dataext = this.getAttribute("data-ext");
				var datacode = this.getAttribute("data-code");
				var dataname = this.getAttribute("data-name");
				var datadesc = '';
				if(this.querySelector('p') != undefined) {
					datadesc = this.querySelector('p').innerHTML;
				}

				//取到选择的数据
				var obj = {
					'dataid': dataid,
					'dataext': dataext,
					'datacode': datacode,
					'dataname': dataname,
					'datadesc': datadesc
				};
				console.log('single select data:' + JSON.stringify(obj));

				//取选择窗口的回调参数
				var opts = self.options.selectParams;
				if(!opts.callbackWinId) {
					mui.alert('没有找到目标窗口对象！');
					return;
				}
				//如果是点击父节点，则进入下一级
				var isparent = this.getAttribute("data-isparent");
				//console.log('single select data:isparent='+ isparent);
				if(isparent && (isparent != 'false') && opts.parentClick) {
					opts.parentClick(opts.treeFunId, dataid, dataname);
					mui('span.parent-title')[0].innerHTML = '-' + dataname;
					return;
				} else {
					var targetWin = plus.webview.getWebviewById(opts.callbackWinId);
					mui.fire(targetWin, opts.callbackEvent, obj);
					//清除节点信息直接返回
					var dataList = document.getElementById("data-list");
					dataList.removeAttribute('parent-param');
					//有些页面不需要返回，而且跳到新页面
					if(!opts.notback) mui.back();
				}
			});
		}
	});

	//mui(selector).indexedList 方式
	$.fn.indexedList = function(options) {
		//遍历选择的元素
		this.each(function(i, element) {
			if(element.indexedList) return;
			element.indexedList = new IndexedList(element, options);
		});
		return this[0] ? this[0].indexedList : null;
	};

})(mui, window, document);