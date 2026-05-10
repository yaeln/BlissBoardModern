export class BlissRenderer {
  constructor(data) {
    this.store = data.store;
    this.visual = data.visual;
  }

  drawSymbolOnCanvas(canvas, symbolName) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Standard unit length and margins to fit symbols nicely.
    let unitLength = canvas.width / 10; 
    const totalW = this.getSymbolWidth(symbolName);
    
    let totalPixelWidth = totalW * unitLength / 2;
    
    // Scale down if it exceeds the canvas width (with a small margin of 0.5 unitLength)
    const maxAllowedWidth = canvas.width - (unitLength * 0.5);
    if (totalPixelWidth > maxAllowedWidth) {
       unitLength = unitLength * (maxAllowedWidth / totalPixelWidth);
       totalPixelWidth = totalW * unitLength / 2;
    }

    // Calculate starting X to center the symbol
    const dx = (canvas.width - totalPixelWidth) / 2;
    
    // Calculate starting Y (fixed)
    const dy = canvas.height / 2 - unitLength * 2;

    ctx.save();
    ctx.translate(dx, dy);
    
    ctx.strokeStyle = '#222';
    ctx.lineWidth = unitLength / 10;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.fillStyle = '#222';

    this.drawSymbol(ctx, symbolName, 0, 0, unitLength);
    
    ctx.restore();
  }

  getSymbolWidth(symbolName) {
    const symbolData = this.store[symbolName];
    if (!symbolData) return 4;
    
    if (symbolData.type === 'Atom' || symbolData.type === 'Indicator') {
      const instructions = this.visual[symbolName] || ["0","3","VertLine","0","4","VertLine","0","3","SteepDown","2","3","VertLine","2","4","VertLine","2","3","SteepUp","2","4","HorizLine","4","3","VertLine","4","4","VertLine"];
      let maxX = 0;
      
      const shapeWidths = {
        'ThingIndicator': 2, 'ActionIndicator': 2, 'EvaluationIndicator': 2,
        'PastIndicator': 1, 'FutureIndicator': 1, 'PluralIndicator': 2,
        'SmallQuestionMark': 2,
        'ArcTopLeft': 4, 'ArcTopRight': 4, 'ArcBottomLeft': 4, 'ArcBottomRight': 4,
        'ArcTopLeftSmall': 2, 'ArcTopRightSmall': 2, 'ArcBottomLeftSmall': 2, 'ArcBottomRightSmall': 2,
        'VertLine': 0, 'HorizLine': 2,
        'DiagUp': 2, 'DiagDown': 2, 'SteepUp': 2, 'SteepDown': 2,
        'UnSteepUp': 4, 'UnSteepDown': 4,
        'Dot': 0,
        'ArcLeftDeep': 2, 'ArcRightDeep': 2, 'ArcLeftShallow': 2, 'ArcRightShallow': 2,
        'ArcTopLeftBig': 2, 'ArcBottomLeftBig': 2, 'ArcTopRightBig': 2, 'ArcBottomRightBig': 2,
        'ArcUpDeep': 4, 'ArcDownDeep': 4, 'ArcUpShallow': 4, 'ArcDownShallow': 4,
        'TinySemiCircleUp': 2,
        'Wheel': 4,
        'HalfHeartLeft': 4, 'HalfHeartRight': 4,
        'Digit0': 2, 'Digit1': 2, 'Digit2': 2, 'Digit3': 2, 'Digit4': 2, 'Digit5': 2,
        'Digit6': 2, 'Digit7': 2, 'Digit8': 2, 'Digit9': 2, 'AlpQuote': 2
      };

      for (let i = 0; i < instructions.length; i += 3) {
        const x = parseFloat(instructions[i]);
        const shape = instructions[i+2];
        const w = shapeWidths[shape] !== undefined ? shapeWidths[shape] : 4;
        if (x + w > maxX) maxX = x + w;
      }
      return maxX;
    } else if (symbolData.type === 'Superimposed') {
      let maxW = 0;
      for (const part of symbolData.parts) {
        const w = this.getSymbolWidth(part);
        if (w > maxW) maxW = w;
      }
      return maxW;
    } else if (symbolData.type === 'Sequential') {
      let totalW = 0;
      for (let i = 0; i < symbolData.parts.length; i++) {
        const part = symbolData.parts[i];
        if (this.store[part] && this.store[part].type === 'Indicator') {
            // Indicators don't add width
        } else {
            totalW += this.getSymbolWidth(part);
            if (i < symbolData.parts.length - 1) totalW += 2;
        }
      }
      return totalW;
    }
    return 4;
  }

  drawSymbol(ctx, symbolName, offsetX, offsetY, unitLength) {
    const symbolData = this.store[symbolName];
    if (!symbolData) return;

    if (symbolData.type === 'Atom' || symbolData.type === 'Indicator') {
      const instructions = this.visual[symbolName] || ["0","3","VertLine","0","4","VertLine","0","3","SteepDown","2","3","VertLine","2","4","VertLine","2","3","SteepUp","2","4","HorizLine","4","3","VertLine","4","4","VertLine"];
      for (let i = 0; i < instructions.length; i += 3) {
        const x = parseFloat(instructions[i]) + offsetX;
        const y = parseFloat(instructions[i+1]) + offsetY;
        const shape = instructions[i+2];
        this.drawShape(ctx, shape, x, y, unitLength);
      }
    } else if (symbolData.type === 'Superimposed') {
      const maxW = this.getSymbolWidth(symbolName);
      for (const part of symbolData.parts) {
        const partW = this.getSymbolWidth(part);
        let centerOffset = offsetX;
        if (partW < maxW) {
          centerOffset += Math.round((maxW - partW) / 2);
        }
        this.drawSymbol(ctx, part, centerOffset, offsetY, unitLength);
      }
    } else if (symbolData.type === 'Sequential') {
      let currentX = offsetX;
      for (let i = 0; i < symbolData.parts.length; i++) {
        const part = symbolData.parts[i];
        if (this.store[part] && this.store[part].type === 'Indicator') {
          // Centered over previous symbol technically, but for simplicity we draw at currentX minus the last width?
          // The java code superimposes on the whole sequence so far.
          // Let's draw it in the middle of the whole sequence so far.
          const totalWSoFar = currentX - offsetX;
          const centerOffset = offsetX + (totalWSoFar / 2) - 2; // -2 for half the width of the indicator
          this.drawSymbol(ctx, part, centerOffset, offsetY, unitLength);
        } else {
          this.drawSymbol(ctx, part, currentX, offsetY, unitLength);
          currentX += this.getSymbolWidth(part) + 2; 
        }
      }
    }
  }

  drawShape(ctx, shape, offsetX, offsetY, u) {
    const x = offsetX * u / 2;
    const y = offsetY * u / 2;

    const drawArc = (ax, ay, w, h, startAngle, arcAngle) => {
      let startRad = -startAngle * Math.PI / 180;
      let endRad = -(startAngle + arcAngle) * Math.PI / 180;
      let anticlockwise = arcAngle > 0;
      
      const cx = ax + w/2;
      const cy = ay + h/2;
      const rx = w/2;
      const ry = h/2;
      
      const startX = cx + rx * Math.cos(startRad);
      const startY = cy + ry * Math.sin(startRad);
      ctx.moveTo(startX, startY);
      
      ctx.ellipse(cx, cy, rx, ry, 0, startRad, endRad, anticlockwise);
    };

    const drawLine = (x1, y1, x2, y2) => {
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
    };

    const drawText = (text, tx, ty, tu) => {
      ctx.font = `${tu*2}px monospace`;
      ctx.fillText(text, tx, ty + 2*tu);
    };

    ctx.beginPath();

    switch(shape) {
      case 'SmallQuestionMark': drawText("?", x, y, u); break;
      case 'ArcTopLeft': drawArc(x, y, 4*u, 4*u, 90, 90); break;
      case 'ArcTopRight': drawArc(x-2*u, y, 4*u, 4*u, 0, 90); break;
      case 'ArcBottomLeft': drawArc(x, y-2*u, 4*u, 4*u, 180, 90); break;
      case 'ArcBottomRight': drawArc(x-2*u, y-2*u, 4*u, 4*u, 270, 90); break;

      case 'ArcTopLeftSmall': drawArc(x, y, 2*u, 2*u, 90, 90); break;
      case 'ArcTopRightSmall': drawArc(x-1*u, y, 2*u, 2*u, 0, 90); break;
      case 'ArcBottomLeftSmall': drawArc(x, y-1*u, 2*u, 2*u, 180, 90); break;
      case 'ArcBottomRightSmall': drawArc(x-1*u, y-1*u, 2*u, 2*u, 270, 90); break;

      case 'HorizLine': drawLine(x, y, x+1*u, y); break;
      case 'VertLine': drawLine(x, y, x, y+1*u); break;

      case 'DiagUp': drawLine(x, y+1*u, x+1*u, y); break;
      case 'DiagDown': drawLine(x, y, x+1*u, y+1*u); break;

      case 'SteepUp': drawLine(x, y+2*u, x+1*u, y); break;
      case 'SteepDown': drawLine(x, y, x+1*u, y+2*u); break;

      case 'UnSteepUp': drawLine(x, y+1*u, x+2*u, y); break;
      case 'UnSteepDown': drawLine(x, y, x+2*u, y+1*u); break;

      case 'Dot': ctx.fillRect(x, y, 2, 2); break;

      case 'ArcLeftDeep': drawArc(x+u/2, y, u, u*2, 90, 180); break;
      case 'ArcRightDeep': drawArc(x-u/2, y, u, u*2, 90, -180); break;
      
      case 'ArcLeftShallow': drawArc(x+u*0.75, y, u/2, u*2, 90, 180); break; 
      case 'ArcRightShallow': drawArc(x-u/4, y, u/2, u*2, 90, -180); break; 
          
      case 'ArcTopLeftBig': drawArc(x, y, u*2, u*4, 90, 90); break;
      case 'ArcTopRightBig': drawArc(x-u, y, u*2, u*4, 90, -90); break;
      case 'ArcBottomLeftBig': drawArc(x, y, u*2, u*4, 90, 90); break;
      case 'ArcBottomRightBig': drawArc(x-u, y, u*2, u*4, 90, -90); break;
      
      case 'ArcUpDeep': drawArc(x, y+u/2, u*2, u, 180, -180); break;
      case 'ArcDownDeep': drawArc(x, y-u/2, u*2, u, 180, 180); break;
          
      case 'ArcUpShallow': drawArc(x, y+u*0.75, u*2, u/2, 180, -180); break;
      case 'ArcDownShallow': drawArc(x, y-u/4, u*2, u/2, 180, 180); break;

      case 'TinySemiCircleUp': drawArc(x, y, u, u, 0, 180); break;

      case 'Wheel':
          drawArc(x, y, u*2, u*2, 0, 360);
          drawLine(x+u/3.33, y+u/3.33, x+u*2-u/3.33, y+u*2-u/3.33);
          drawLine(x+u/3.33, y+u*2-u/3.33, x+u*2-u/3.33, y+u/3.33);
          break;
      case 'HalfHeartLeft':
          drawLine(x, y+2*u, x+2*u, y+4*u);
          drawArc(x, y+1*u, u*2, u*2, 0, 180);
          break;
      case 'HalfHeartRight':
          drawLine(x+2*u, y+2*u, x, y+4*u);
          drawArc(x, y+1*u, u*2, u*2, 0, 180);
          break;
      
      case 'Digit0': drawText("0", x, y, u); break;
      case 'Digit1': drawText("1", x, y, u); break;
      case 'Digit2': drawText("2", x, y, u); break;
      case 'Digit3': drawText("3", x, y, u); break;
      case 'Digit4': drawText("4", x, y, u); break;
      case 'Digit5': drawText("5", x, y, u); break;
      case 'Digit6': drawText("6", x, y, u); break;
      case 'Digit7': drawText("7", x, y, u); break;
      case 'Digit8': drawText("8", x, y, u); break;
      case 'Digit9': drawText("9", x, y, u); break;
      case 'AlpQuote': drawText("`", x, y, u); break;

      case 'ThingIndicator':
          drawLine(x, y, x+u, y);
          drawLine(x, y+u, x+u, y+u);
          drawLine(x, y, x, y+u);
          drawLine(x+u, y, x+u, y+u);
          break;
      case 'ActionIndicator':
          drawLine(x+u/2, y, x, y+u);
          drawLine(x+u/2, y, x+u, y+u);
          break;
      case 'PluralIndicator':
          drawLine(x, y, x+u, y+u);
          drawLine(x+u, y, x, y+u);
          break;
      case 'EvaluationIndicator':
          drawLine(x+u/2, y+u, x, y);
          drawLine(x+u/2, y+u, x+u, y);
          break;
      case 'PastIndicator':
          drawArc(x-u/2, y, u, u, 90, -180);
          break;
      case 'FutureIndicator':
          drawArc(x, y, u, u, 90, 180);
          break;
    }
    
    ctx.stroke();
  }
}
