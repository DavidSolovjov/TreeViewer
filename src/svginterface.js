TV.SVGInterface = function (svg)
{
	this.svg = svg;
	this.svgNodes = {};
	this.svg.setAttributeNS (null, 'transform', 'translate(0.5,0.5)');
	this.events = null;
};

TV.SVGInterface.prototype.RegisterEvents = function (events)
{
	this.events = events;
	this.svg.addEventListener ('mousedown', this.OnMouseDown.bind (this), false);
	document.addEventListener ('mouseup', this.OnMouseUp.bind (this), false);
	document.addEventListener ('mousemove', this.OnMouseMove.bind (this), false);
	this.svg.addEventListener ('DOMMouseScroll', this.OnMouseWheel.bind (this), false);
	this.svg.addEventListener ('mousewheel', this.OnMouseWheel.bind (this), false);
};

TV.SVGInterface.prototype.UpdateNode = function (node, offset, scale)
{
	function GetValue (original, offset, scale)
	{
		var result = original;
		if (scale !== null) {
			result *= scale;
		}
		if (offset !== null) {
			result += offset;
		}
		return parseInt (result, 10);
	}
	
	var nodeId = node.GetId ();
	var svgNode = this.svgNodes[nodeId];
	if (svgNode === undefined || svgNode === null) {
		svgNode = this.CreateNode (node);
	}
	
	var className = node.HasChild () ? 'haschild' : 'nochild';
	var position = node.GetPosition ();
	var size = node.GetSize ();
	
	if (node.HasParent ()) {
		var start = node.GetParent ().GetRightAnchor ();
		var end = node.GetLeftAnchor ();
		svgNode.line.setAttributeNS (null, 'x1', GetValue (start.x, offset.x, scale));
		svgNode.line.setAttributeNS (null, 'y1', GetValue (start.y, offset.y, scale));
		svgNode.line.setAttributeNS (null, 'x2', GetValue (end.x, offset.x, scale));
		svgNode.line.setAttributeNS (null, 'y2', GetValue (end.y, offset.y, scale));
	}

	svgNode.rect.setAttributeNS (null, 'x', GetValue (position.x, offset.x, scale));
	svgNode.rect.setAttributeNS (null, 'y', GetValue (position.y, offset.y, scale));
	svgNode.rect.setAttributeNS (null, 'width', GetValue (size.x, null, scale));
	svgNode.rect.setAttributeNS (null, 'height', GetValue (size.y, null, scale));
	svgNode.rect.setAttributeNS (null, 'class', className);
	
	svgNode.text.setAttributeNS (null, 'font-size', GetValue (15, null, scale));
	var textBox = svgNode.text.getBBox ();
	var textX = position.x + size.x / 2;
	var textY = position.y + (size.y + textBox.height / 2) / 2;
	svgNode.text.setAttributeNS (null, 'x', GetValue (textX, offset.x, scale));
	svgNode.text.setAttributeNS (null, 'y', GetValue (textY, offset.y, scale));
	svgNode.text.setAttributeNS (null, 'class', className);
};

TV.SVGInterface.prototype.CreateNode = function (node)
{
	var nodeId = node.GetId ();
	var svgNode = {
		rect : null,
		text : null,
		line : null
	};
	
	var svgNamespace = 'http://www.w3.org/2000/svg';
	if (node.HasParent ()) {
		svgNode.line = document.createElementNS (svgNamespace, 'line');
		svgNode.line.setAttributeNS (null, 'stroke', 'black');
		this.svg.appendChild (svgNode.line);
	}

	svgNode.rect = document.createElementNS (svgNamespace, 'rect');
	svgNode.rect.setAttributeNS (null, 'stroke', 'black');
	svgNode.rect.setAttributeNS (null, 'fill', 'white');
	this.svg.appendChild (svgNode.rect);
	
	svgNode.text = document.createElementNS (svgNamespace, 'text');
	svgNode.text.setAttributeNS (null, 'fill', 'black');
	svgNode.text.setAttributeNS (null, 'font-size', '15px');
	svgNode.text.setAttributeNS (null, 'font-family', 'arial, cursive');
	svgNode.text.setAttributeNS (null, 'text-anchor', 'middle');
	svgNode.text.setAttributeNS (null, 'alignment-baseline', 'middle');
	svgNode.text.textContent = node.GetText ()
	this.svg.appendChild (svgNode.text);
	
	this.svgNodes[nodeId] = svgNode;
	if (this.events !== null) {
		var myThis = this;
		svgNode.rect.addEventListener ('click', function (event) { myThis.OnNodeClick (event, node); }, false);
		svgNode.text.addEventListener ('click', function (event) { myThis.OnNodeClick (event, node); }, false);
	}

	return svgNode;
};

TV.SVGInterface.prototype.OnNodeClick = function (event, node)
{
	function DeleteNode (node, svg, svgNodes)
	{
		var nodeId = node.GetId ();
		var svgNode = svgNodes[nodeId];
		if (svgNode !== undefined && svgNode !== null) {
			svgNodes[nodeId] = null;
			svg.removeChild (svgNode.rect);
			svg.removeChild (svgNode.text);
			svg.removeChild (svgNode.line);
		}
	};

	this.events.onNodeClick (node);
	if (node.IsCollapsed ()) {
		var svg = this.svg;
		var svgNodes = this.svgNodes;
		node.EnumerateChildrenRecursive (function (child) {
			DeleteNode (child, svg, svgNodes);
		});		
	}
};

TV.SVGInterface.prototype.OnMouseDown = function (event)
{
	var eventParameters = event || window.event;
	this.events.onMouseDown (event.clientX, event.clientY);
};

TV.SVGInterface.prototype.OnMouseUp = function (event)
{
	var eventParameters = event || window.event;
	this.events.onMouseUp (event.clientX, event.clientY);
};

TV.SVGInterface.prototype.OnMouseMove = function (event)
{
	var eventParameters = event || window.event;
	this.events.onMouseMove (event.clientX, event.clientY);
};

TV.SVGInterface.prototype.OnMouseWheel = function (event)
{
	var eventParameters = event || window.event;
	var delta = 0;
	if (eventParameters.detail) {
		delta = -eventParameters.detail;
	} else if (eventParameters.wheelDelta) {
		delta = eventParameters.wheelDelta / 40;
	}
	this.events.onMouseWheel (delta);
};
