function Renderer( parent, width, height, gridsize, image) {
  this.width = width;
  this.height = height;
  this.gridsize = gridsize;
  this.image = image;
  var canvas = document.createElement( 'canvas');
  canvas.setAttribute( 'width', width);
  canvas.setAttribute( 'height', height);
  parent.append( canvas);
  this.ctx = canvas.getContext( '2d');
};
Renderer.prototype.Clear = function( color) {
  this.ctx.fillStyle = color;
  this.ctx.fillRect( 0, 0, this.width, this.height);
};
Renderer.prototype.Render = function( viewport, world) {
  this.Clear( '#000000');
  var offsetx = Math.ceil( (this.width / this.gridsize + 4) / 2);
  var offsety = Math.ceil( (this.height / this.gridsize + 4) / 2);
  for( var oy = -offsety; oy <= offsety; ++oy) {
    var y = viewport.y + oy;
    var screenY = (oy + offsety) * this.gridsize;

    for( var ox = -offsetx; ox <= offsetx; ++ox) {
      var x = viewport.x + ox;
      var screenX = (ox + offsetx) * this.gridsize;

      var done = false;
      if( x >= 0 && y >= 0 && y < world.length && x < world[y].length) {
        if( world[y][x] != null) {
          this.DrawTile( screenX, screenY, world[y][x]);
          done = true;
        }
      }
      if( !done) {
        this.DrawBackgroundTile( screenX, screenY);
      }
    }
  }
}
Renderer.prototype.DrawTile = function( sx, sy, tile) {
  var tex = tile.Texture();
  this.DrawImageTile( sx, sy, tex.x, tex.y);
  if( tile.item != null) {
    this.DrawImageTile( sx, sy, tile.item.tex.x, tile.item.tex.y);
  }
  if( tile.spawn != null) {
    this.DrawImageTile( sx, sy, tile.spawn.tex.x, tile.spawn.tex.y);
  }
}
Renderer.prototype.DrawBackgroundTile = function( sx, sy, tile) {
}
Renderer.prototype.DrawImageTile = function( x, y, tx, ty) {
  this.ctx.drawImage( this.image, tx*32, ty*32, 32, 32, x, y, this.gridsize, this.gridsize);
}
