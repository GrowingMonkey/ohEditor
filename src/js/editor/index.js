import { plugins as PLUGINS } from '../plugins/index';

/*编辑器编号*/
let ID = 1;

class OhEditor{
	constructor(element, opts){
		const _opts = {
			toolbar: [
				'paragraph', 'quote', 'fontFamily', 'fontSize', 'bold', 'italic', 'color', 
				'underline','strikeThrough', '|', 'align', 'ol', 'ul', 'insertLink', 'unlink',
				'insertImage', 'insertVideo', 'insertFile', 'insertTable', '|', 'insertHR', 
				'clearFormatting', 'print', 'help', 'html', '|', 'undo', 'redo', 'fullscreen'
			],
			minHeight: '300px',
			minWidth: '100%',
			placeHolder: '请输入内容'
		};

		this.id = ID;
		ID++;
		this.$editor = document.getElementById(element);
		this._opts = Object.assign({}, _opts, opts);
	}

	create(){
		this._initFrame();
		this._initPlugins();
	}

	/**
	 * 注册插件
	 * @param {function} [plugins] [一个或者多个插件]
	 * @return {[OhEditor]} [OhEditor实例]
	 */
	registerPlugin(...plugins){
		plugins.forEach(plugin=>{
			plugin(this);
		});
		return this;
	}

	/**
	 * 初始化编辑器框架
	 * @return {[OhEditor]} [OhEditor实例]
	 */
	_initFrame(){
		this._createWrapDom();
		this._createToolbarDom();
		this._createContainerDom();
	}

	/**
	 * 创建wrap
	 * @return {[type]} [description]
	 */
	_createWrapDom(){
		let $wrap = document.createElement('div');
		$wrap.setAttribute('class', `oh-wrap`);
		$wrap.setAttribute('id', `oh-editor${this.id}`);

		this.$editor.append($wrap);
		this.$wrap = $wrap;
		return this;
	}

	/**
	 * 创建toolbar
	 * @return {[type]} [description]
	 */
	_createToolbarDom(){
		if(!this._opts.toolbar || !this._opts.toolbar.length){
			console.warn('没有定义 toolbar ，无法操作编辑器！');
			return this;
		}
		let $toolbar = document.createElement('div');
		$toolbar.setAttribute('class', 'oh-toolbar');

		this.$wrap.append($toolbar);
		this.$toolbar = $toolbar;
		return this;
	}

	/**
	 * 创建可视编辑区
	 * @return {[type]} [description]
	 */
	_createContainerDom(){
		let $container = document.createElement('div');

		$container.setAttribute('class', 'oh-container');
		$container.setAttribute('contenteditable', 'true');
		$container.setAttribute('style', `width: ${this._opts.minWidth};height: ${this._opts.minHeight}`);
		
		this.$wrap.append($container);
		this.$container = $container;
		return this;
	}

	/**
	 * 加载各种功能插件
	 * @return {[OhEditor]} [OhEditor实例]
	 */
	_initPlugins(){
		this.registerPlugin(PLUGINS);
	}
}

export { OhEditor };