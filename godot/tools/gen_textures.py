"""Generates the tileable starter textures for Faithbound (albedo + normal maps).
Run: python tools/gen_textures.py   (needs numpy and pillow)
Scanned CC0 textures from Poly Haven can replace these: see tools/fetch_textures.py."""
import numpy as np, os
from PIL import Image, ImageFilter
OUT=os.path.join(os.path.dirname(__file__),'..','assets','textures')
S=1024
rng=np.random.default_rng(7)

def vnoise(f,seed):
    """tileable value noise at integer frequency f, smooth (cosine) interpolation"""
    r=np.random.default_rng(seed).random((f,f))
    x=np.linspace(0,f,S,endpoint=False);i=np.floor(x).astype(int);t=x-i;t=t*t*(3-2*t)
    i1=(i+1)%f
    a=r[i][:,i];b=r[i][:,i1];c=r[i1][:,i];d=r[i1][:,i1]
    tx=t[None,:];ty=t[:,None]
    return (a*(1-tx)+b*tx)*(1-ty)+(c*(1-tx)+d*tx)*ty
def fbm(base,oct,seed,gain=.5):
    s=np.zeros((S,S));a=1;n=0
    for o in range(oct):s+=vnoise(base*2**o,seed+o*13)*a;n+=a;a*=gain
    return s/n
def worley(n,seed):
    """tileable cellular distance (cracks/stones)"""
    r=np.random.default_rng(seed);pts=r.random((n,2))*S
    yy,xx=np.mgrid[0:S,0:S].astype(np.float32)
    d1=np.full((S,S),1e9,np.float32);d2=np.full((S,S),1e9,np.float32);idx=np.zeros((S,S),np.int32)
    for k,(px,py) in enumerate(pts):
        dx=np.abs(xx-px);dx=np.minimum(dx,S-dx);dy=np.abs(yy-py);dy=np.minimum(dy,S-dy);d=np.sqrt(dx*dx+dy*dy)
        m=d<d1;d2=np.where(m,d1,np.minimum(d2,d));idx=np.where(m,k,idx);d1=np.where(m,d,d1)
    return d1,d2,idx
def normal(h,strength):
    gx=(np.roll(h,-1,1)-np.roll(h,1,1))*strength;gy=(np.roll(h,-1,0)-np.roll(h,1,0))*strength
    n=np.stack([-gx,-gy,np.ones_like(h)],-1);n/=np.linalg.norm(n,axis=-1,keepdims=True)
    return Image.fromarray(((n*.5+.5)*255).astype(np.uint8))
def save(name,rgb,h,strength=4.):
    rgb=np.clip(rgb,0,1);Image.fromarray((rgb*255).astype(np.uint8)).save(os.path.join(OUT,name+'_albedo.png'))
    normal(h,strength).save(os.path.join(OUT,name+'_normal.png'));print('wrote',name)
def mix(a,b,t):return a*(1-t[...,None])+b*t[...,None]
def col(*c):return np.array(c,np.float32)/255.
def strokes(h,n,length,width,seed,angle=None,jit=.6,val=1.):
    """draw short strands (grass blades, straw) into a height map, wrapping at the edges"""
    from PIL import ImageDraw
    img=Image.new('F',(S,S),0);d=ImageDraw.Draw(img);r=np.random.default_rng(seed)
    for _ in range(n):
        x,y=r.random()*S,r.random()*S;a=(angle if angle is not None else r.random()*6.283)+(r.random()-.5)*jit;l=length*(.5+r.random())
        x2,y2=x+np.cos(a)*l,y+np.sin(a)*l;v=val*(.4+r.random()*.6)
        for ox in (-S,0,S):
            for oy in (-S,0,S):d.line([(x+ox,y+oy),(x2+ox,y2+oy)],fill=v,width=width)
    return h+np.array(img)

def grass():
    big=fbm(3,4,1);mid=fbm(12,3,2);h=fbm(64,3,3)*.5
    h=strokes(h,26000,14,2,4,jit=6.3,val=.6)
    h=h/h.max()
    lush,dry,dark=col(58,92,30),col(128,132,58),col(34,58,20)
    c=mix(lush,dry,np.clip((big-.45)*3,0,1));c=mix(c,dark,np.clip((.45-mid)*2.5,0,1)*.7)
    c=c*(.7+.6*h[...,None])
    soil=np.clip((fbm(20,3,9)-.68)*6,0,1)*(1-h);c=mix(c,col(92,74,50),soil*.8)
    r=np.random.default_rng(5)
    for _ in range(900):
        x,y=r.integers(0,S,2);cc=[col(240,236,220),col(236,206,60),col(190,80,170)][r.integers(0,3)]
        c[max(0,y-1):y+2,max(0,x-1):x+2]=cc
    save('grass',c,h,6.)
def dirt():
    h=fbm(8,5,11)*.6+fbm(48,3,12)*.4;d1,d2,_=worley(500,13);peb=np.clip(1-d1/7,0,1)
    h=h*.7+peb*.5
    c=mix(col(112,90,64),col(150,128,96),np.clip(fbm(4,3,14)*1.4-.2,0,1))
    c=mix(c,col(160,150,140),peb*.7);c=c*(.75+.5*fbm(64,2,15)[...,None])
    save('dirt',c,h,5.)
def path():
    h=fbm(10,5,21)*.5;d1,_,_=worley(900,22);peb=np.clip(1-d1/5,0,1);h=h+peb*.4
    c=mix(col(150,136,110),col(176,164,140),fbm(5,3,23));c=mix(c,col(196,190,178),peb*.6);c*= (.85+.3*fbm(80,2,24))[...,None]
    save('path',c,h,4.)
def rock():
    d1,d2,idx=worley(70,31);cr=np.clip((d2-d1)/18,0,1);h=fbm(6,6,32)*.6+cr*.4
    tone=np.random.default_rng(33).random(70)[idx]
    c=mix(col(92,88,82),col(140,134,124),np.clip(tone*.6+fbm(16,4,34)*.6-.1,0,1));c*= (.55+.45*cr)[...,None]
    lich=np.clip((fbm(10,3,35)-.62)*5,0,1);c=mix(c,col(118,124,82),lich*.5)
    save('rock',c,h,8.)
def sand():
    h=fbm(6,5,41)*.5+np.sin(np.linspace(0,40*np.pi,S))[None,:]*.04+fbm(90,2,42)*.3
    c=mix(col(196,178,138),col(220,206,166),fbm(4,3,43));c*= (.88+.24*fbm(120,2,44))[...,None];save('sand',c,h,3.)
def snow():
    h=fbm(5,6,51);c=mix(col(222,230,238),col(246,248,252),h);save('snow',c,h,2.)
def forest_floor():
    h=fbm(10,4,61)*.5;h=strokes(h,9000,9,2,62,jit=6.3,val=.5);h=h/h.max()
    c=mix(col(54,44,30),col(92,72,44),fbm(6,3,63));c=mix(c,col(52,70,32),np.clip((fbm(8,3,64)-.55)*4,0,1)*.7);c*= (.65+.6*h)[...,None]
    save('forest',c,h,6.)
def thatch():
    h=fbm(40,3,71)*.3;h=strokes(h,30000,40,2,72,angle=np.pi/2,jit=.25,val=.8);h=h/h.max()
    rows=(np.sin(np.linspace(0,9*2*np.pi,S))[:,None]*.5+.5);h=h*.8+rows*.2
    c=mix(col(108,94,70),col(156,138,98),h);moss=np.clip((fbm(6,3,73)-.6)*4,0,1);c=mix(c,col(84,94,52),moss*.55)
    c*= (.8+.25*fbm(4,3,74))[...,None];save('thatch',c,h,7.)
def timber():
    planks=8;x=np.arange(S);pid=(x*planks//S);seam=((x%(S//planks))<4)
    r=np.random.default_rng(81);tone=r.random(planks)[pid]
    grain=fbm(4,4,82);g2=np.sin((np.arange(S)[:,None]*.06+grain*20+pid[None,:]*7))*.5+.5
    h=g2*.3+fbm(30,3,83)*.3;h[:,seam]=0
    c=mix(col(92,72,52),col(128,104,76),(tone[None,:]*.6+g2*.4));c[:,seam]=col(40,30,22);c*= (.8+.3*fbm(8,3,84))[...,None]
    weather=np.linspace(0,1,S)[:,None]**3;c=mix(c,col(70,64,58),weather*np.ones((1,S))*.5)
    save('timber',c,h,5.)
def plaster():
    h=fbm(8,6,91)*.6+fbm(60,2,92)*.4;c=mix(col(214,204,184),col(236,230,216),h);dirtb=np.linspace(0,1,S)[:,None]**4
    c=mix(c,col(150,132,104),dirtb*np.ones((1,S))*.6);save('plaster',c,h,2.5)
def bark():
    h=fbm(6,4,101)*.4;h=strokes(h,7000,60,3,102,angle=np.pi/2,jit=.15,val=.9);h=h/h.max()
    c=mix(col(54,42,32),col(102,88,72),h);save('bark',c,h,8.)
def leaves():
    """RGBA leaf-cluster card for tree canopies (alpha cutout)"""
    from PIL import ImageDraw
    N=512;img=Image.new('RGBA',(N,N),(0,0,0,0));d=ImageDraw.Draw(img);r=np.random.default_rng(111)
    for _ in range(1600):
        cx,cy=r.normal(N/2,N*.2,2);
        if not(10<cx<N-10 and 10<cy<N-10):continue
        a=r.random()*6.283;L=10+r.random()*12;W=L*.45;g=r.random()
        base=np.array([48+g*40,78+g*50,28+g*18])*(.7+r.random()*.5)
        pts=[(cx+np.cos(a)*L,cy+np.sin(a)*L),(cx+np.cos(a+1.57)*W,cy+np.sin(a+1.57)*W),(cx-np.cos(a)*L*.4,cy-np.sin(a)*L*.4),(cx+np.cos(a-1.57)*W,cy+np.sin(a-1.57)*W)]
        d.polygon(pts,fill=tuple(int(min(255,v)) for v in base)+(255,))
    img.save(os.path.join(OUT,'leaves_albedo.png'))
    a=np.array(img).astype(np.float32);h=a[...,3]/255.*(.5+.5*a[...,1]/255.)
    gx=(np.roll(h,-1,1)-np.roll(h,1,1))*3;gy=(np.roll(h,-1,0)-np.roll(h,1,0))*3;n=np.stack([-gx,-gy,np.ones_like(h)],-1);n/=np.linalg.norm(n,axis=-1,keepdims=True)
    Image.fromarray(((n*.5+.5)*255).astype(np.uint8)).save(os.path.join(OUT,'leaves_normal.png'));print('wrote leaves')
def needles():
    from PIL import ImageDraw
    N=512;img=Image.new('RGBA',(N,N),(0,0,0,0));d=ImageDraw.Draw(img);r=np.random.default_rng(121)
    for b in range(9):
        y0=40+b*50;w=N*.5*(1-b/11)
        d.line([(N/2-w,y0+30),(N/2+w,y0+30)],fill=(60,44,30,255),width=3)
        for _ in range(420):
            x=N/2+(r.random()-.5)*2*w;y=y0+30+(r.random()-.5)*14;a=-1.57+(r.random()-.5)*2.2;L=10+r.random()*14
            g=r.random();d.line([(x,y),(x+np.cos(a)*L,y+np.sin(a)*L*.6+8)],fill=(int(28+g*30),int(58+g*40),int(30+g*20),255),width=2)
    img.save(os.path.join(OUT,'needles_albedo.png'));print('wrote needles')
for f in (grass,dirt,path,rock,sand,snow,forest_floor,thatch,timber,plaster,bark,leaves,needles):f()
