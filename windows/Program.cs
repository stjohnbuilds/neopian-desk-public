using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Windows;
using System.Windows.Automation;
using System.Windows.Controls;
using System.Windows.Interop;
using System.Windows.Media;
using System.Windows.Threading;

namespace NeopianDesk;
record Price(string name, long? estimatedValue, string priceDate, string[] flags);
record Item(string name, double x, double y, double width, double height, long? cost);
record Observation(string url, long window, Item[] items, string message, string tab="", string? find=null, uint lastInput=0);
static class Program {
  static Application app = null!;
  static readonly List<Window> badges = new();
  static Dictionary<string,Price> prices = new(StringComparer.OrdinalIgnoreCase);
  static HashSet<string> names = new(StringComparer.OrdinalIgnoreCase);
  static bool running, reading, autoJump;
  static string testItem = "";
  static string jumpedPage = "";
  [StructLayout(LayoutKind.Sequential)] struct LastInputInfo { public uint cbSize; public uint time; }
  [DllImport("user32.dll")] static extern bool GetLastInputInfo(ref LastInputInfo value);
  [DllImport("user32.dll")] static extern bool SetForegroundWindow(nint handle);
  static uint LastInput() {var value=new LastInputInfo {cbSize=(uint)Marshal.SizeOf<LastInputInfo>()};return GetLastInputInfo(ref value)?value.time:0;}

  static nint observedWindow;
  static string observedURL = "";
  [DllImport("user32.dll")] static extern nint GetForegroundWindow();
  [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(nint handle,out uint pid);
  [DllImport("user32.dll",EntryPoint="GetWindowLongPtrW")] static extern nint GetWindowLongPtr(nint handle,int index);
  [DllImport("user32.dll",EntryPoint="SetWindowLongPtrW")] static extern nint SetWindowLongPtr(nint handle,int index,nint value);
  [DllImport("user32.dll")] static extern bool SetWindowPos(nint handle,nint after,int x,int y,int width,int height,uint flags);
  [DllImport("user32.dll")] static extern uint GetDpiForWindow(nint handle);
  static void Emit(object value) { lock(Console.Out) Console.WriteLine(JsonSerializer.Serialize(value)); }
  [STAThread] static void Main(string[] args) {
    if(args.Contains("--self-test")){ SelfTest(); return; }
    app=new Application { ShutdownMode=ShutdownMode.OnExplicitShutdown };
    var timer=new DispatcherTimer { Interval=TimeSpan.FromMilliseconds(650) };
    timer.Tick+=async(_,_)=>{
      if(!running){Clear();return;}
      if(GetForegroundWindow()!=observedWindow)Clear();
      if(reading)return;reading=true;
      try { var result=(await Task.Run(Read)) with {lastInput=LastInput()}; if(running && GetForegroundWindow()==(nint)result.window)Render(result);else Clear();Emit(new {type="observation",data=result,tags=badges.Count,clickThrough=badges.All(b=>(GetWindowLongPtr(new WindowInteropHelper(b).Handle,-20).ToInt64()&0x20)!=0)}); }
      catch(Exception e){Clear();Emit(new{type="error",message="Browser accessibility could not be read: "+e.Message});}
      finally {reading=false;}
    };
    _=Task.Run(async()=>{string? line;while((line=await Console.In.ReadLineAsync())!=null){if(line.Length>8000000)continue;try{using var doc=JsonDocument.Parse(line);var command=doc.RootElement.Clone();await app.Dispatcher.InvokeAsync(()=>Command(command));}catch(Exception e){Emit(new{type="error",message=e.Message});}}await app.Dispatcher.InvokeAsync(()=>app.Shutdown());});
    timer.Start();Emit(new{type="ready"});app.Run();
  }
  static void Command(JsonElement command){
    switch(command.GetProperty("action").GetString()){
      case "start":running=true;break;
      case "stop":running=false;Clear();break;
      case "prices":
        prices=command.GetProperty("items").Deserialize<Price[]>()!.ToDictionary(p=>p.name,StringComparer.OrdinalIgnoreCase);names=prices.Keys.ToHashSet(StringComparer.OrdinalIgnoreCase);break;
      case "options":autoJump=command.GetProperty("autoJump").GetBoolean();testItem=command.GetProperty("testItem").GetString()??"";jumpedPage="";break;
      case "select":
        _=Task.Run(()=>{try{SelectTab(command);}catch(Exception e){Emit(new{type="error",message="Could not return to the shop tab: "+e.Message});}});break;
      case "close":Clear();app.Shutdown();break;
    }
  }
  static void SelectTab(JsonElement command){
    var handle=(nint)command.GetProperty("window").GetInt64();
    GetWindowThreadProcessId(handle,out var pid);
    if(pid==0 || !new[]{"chrome","msedge"}.Contains(Process.GetProcessById((int)pid).ProcessName))return;
    var expected=command.GetProperty("url").GetString();if(!Supported(expected??""))return;
    var identity=command.GetProperty("tab").GetString();
    var root=AutomationElement.FromHandle(handle);
    var tabs=root.FindAll(TreeScope.Descendants,new PropertyCondition(AutomationElement.ControlTypeProperty,ControlType.TabItem));
    foreach(AutomationElement tab in tabs){if(string.Join(",",tab.GetRuntimeId())==identity && tab.TryGetCurrentPattern(SelectionItemPattern.Pattern,out var pattern)){
      if(!SetForegroundWindow(handle))throw new Exception("The browser declined focus. Select the shop tab manually.");
      ((SelectionItemPattern)pattern).Select();return;
    }}
    throw new Exception("That tab was closed or changed. Select it manually.");
  }
  static string SelectedTab(AutomationElement root){
    var tabs=root.FindAll(TreeScope.Descendants,new PropertyCondition(AutomationElement.ControlTypeProperty,ControlType.TabItem));
    foreach(AutomationElement tab in tabs)if(tab.TryGetCurrentPattern(SelectionItemPattern.Pattern,out var pattern)&&((SelectionItemPattern)pattern).Current.IsSelected)return string.Join(",",tab.GetRuntimeId());
    return "";
  }
  static string? Address(AutomationElement root){
    var edits=root.FindAll(TreeScope.Descendants,new PropertyCondition(AutomationElement.ControlTypeProperty,ControlType.Edit));
    foreach(AutomationElement edit in edits){
      var ancestor=TreeWalker.ControlViewWalker.GetParent(edit);var inPage=false;var depth=0;
      while(ancestor!=null && depth++<30){if(ancestor.Current.ControlType==ControlType.Document){inPage=true;break;}ancestor=TreeWalker.ControlViewWalker.GetParent(ancestor);}
      if(inPage)continue;
      if(edit.TryGetCurrentPattern(ValuePattern.Pattern,out var pattern)){
      var value=((ValuePattern)pattern).Current.Value;if(!value.Contains("://"))value="https://"+value;
      if(Supported(value))return value;
    }}return null;
  }
  internal static bool Supported(string value){
    if(!Uri.TryCreate(value,UriKind.Absolute,out var u)||u.Scheme!="https"||!(u.Host=="www.neopets.com"||u.Host=="neopets.com")||!string.IsNullOrEmpty(u.UserInfo)||!u.IsDefaultPort)return false;
    if(new[]{"/inventory.phtml","/safetydeposit.phtml"}.Contains(u.AbsolutePath))return true;
    var query=System.Web.HttpUtility.ParseQueryString(u.Query);
    if(u.AbsolutePath=="/market.phtml")return query["type"]=="your";
    if(u.AbsolutePath=="/browseshop.phtml")return Regex.IsMatch(query["owner"]??"","^[a-zA-Z0-9_]{1,50}$");
    return u.AbsolutePath=="/objects.phtml"&&query["type"]=="shop"&&int.TryParse(query["obj_type"],out var id)&&id>0&&id<200;
  }
  static Observation Read(){
    var handle=GetForegroundWindow();GetWindowThreadProcessId(handle,out var pid);
    if(pid==0)return new("",(long)handle,[],"Open a supported Neopets page in Chrome or Edge.");
    var process=Process.GetProcessById((int)pid).ProcessName;
    if(process!="chrome"&&process!="msedge")return new("",(long)handle,[],"Price tags pause outside Chrome and Edge.");
    var root=AutomationElement.FromHandle(handle);var address=Address(root);
    if(address==null)return new("",(long)handle,[],"Open a supported Neopets shop, inventory or SDB page.");
    var document=root.FindFirst(TreeScope.Descendants,new PropertyCondition(AutomationElement.ControlTypeProperty,ControlType.Document));
    if(document==null)return new(address,(long)handle,[],"The browser has not exposed the page to accessibility yet.");
    var cache=new CacheRequest{TreeScope=TreeScope.Element,AutomationElementMode=AutomationElementMode.Full};
    cache.Add(AutomationElement.NameProperty);cache.Add(AutomationElement.ControlTypeProperty);cache.Add(AutomationElement.BoundingRectangleProperty);cache.Add(AutomationElement.IsOffscreenProperty);
    AutomationElementCollection elements;
    using(cache.Activate())elements=document.FindAll(TreeScope.Descendants,new OrCondition(new PropertyCondition(AutomationElement.ControlTypeProperty,ControlType.Image),new PropertyCondition(AutomationElement.ControlTypeProperty,ControlType.Text),new PropertyCondition(AutomationElement.ControlTypeProperty,ControlType.Button)));
    if(elements.Count>6000)return new(address,(long)handle,[],"This page is too large to inspect safely. Narrow the visible list.");
    var nodes=new List<(string name,ControlType type,Rect rect,AutomationElement element,bool offscreen)>();
    foreach(AutomationElement element in elements){var c=element.Cached;if(c.BoundingRectangle.IsEmpty||c.Name.Length>600)continue;nodes.Add((c.Name.Trim(),c.ControlType,c.BoundingRectangle,element,c.IsOffscreen));}
    var result=new List<Item>();var known=names;var estimates=prices;string? found=null;AutomationElement? jump=null;
    foreach(var node in nodes.Where(n=>n.type==ControlType.Image && n.rect.Width>=35 && n.rect.Width<=180 && n.rect.Height>=35 && n.rect.Height<=180)){
      var name=node.name;
      if(string.IsNullOrWhiteSpace(name)||name.Length>200)continue;
      if(!known.Contains(name) && !nodes.Any(n=>n.type==ControlType.Text && n.name==name && Math.Abs(n.rect.Left-node.rect.Left)<80 && n.rect.Top>=node.rect.Top && n.rect.Top<=node.rect.Bottom+80))continue;
      // Require an exact accessible item identity and a unique nearby cost label.
      // Missing cost remains unknown; no inferred purchase or stock count is saved.
      var nearby=nodes.Where(n=>n.rect.Top>=node.rect.Top-3 && n.rect.Top<=node.rect.Bottom+100 && Math.Abs((n.rect.Left+n.rect.Width/2)-(node.rect.Left+node.rect.Width/2))<70).Select(n=>ParseCost(n.name)).Where(c=>c.HasValue).Distinct().ToArray();
      long? cost=nearby.Length==1?nearby[0]:null;
      if(!node.offscreen)result.Add(new Item(name,node.rect.X,node.rect.Y,node.rect.Width,node.rect.Height,cost));
      if(found==null && (name==testItem || (estimates.TryGetValue(name,out var estimate) && estimate.flags.Length==0 && estimate.estimatedValue>=100000 && cost.HasValue && cost<=estimate.estimatedValue/2))){found=name;jump=node.element;}
    }
    if(GetForegroundWindow()!=handle||Address(root)!=address)return new("",(long)handle,[],"Page changed; stale tags cleared.");
    if(autoJump && found!=null && address!=jumpedPage && jump!=null){
      jumpedPage=address;
      if(jump.TryGetCurrentPattern(ScrollItemPattern.Pattern,out var scroll))((ScrollItemPattern)scroll).ScrollIntoView();
    }
    return new(address,(long)handle,result.Take(150).ToArray(),result.Count==0?"No exact item identities found in the visible page.":$"{result.Count} visible items identified.",SelectedTab(root),found);
  }
  internal static long? ParseCost(string text){var m=Regex.Match(text,@"^(?:Cost:\s*)?([\d,]+)\s*NP$",RegexOptions.IgnoreCase);return m.Success&&long.TryParse(m.Groups[1].Value.Replace(",",""),out var value)&&value>0?value:null;}
  static void Clear(){foreach(var badge in badges)badge.Close();badges.Clear();}
  static void Render(Observation observation){
    Clear();observedWindow=(nint)observation.window;observedURL=observation.url;
    if(!Supported(observedURL)||GetForegroundWindow()!=observedWindow)return;
    foreach(var item in observation.items){if(!prices.TryGetValue(item.name,out var price))continue;
      var text=price.estimatedValue.HasValue?$"Est. {price.estimatedValue:N0} NP":"Price unknown";
      if(!string.IsNullOrEmpty(price.priceDate))text+=" · "+price.priceDate[..Math.Min(10,price.priceDate.Length)];
      var profit=price.estimatedValue-item.cost;
      if(price.flags.Length>0)text+=" · flagged";else if(profit.HasValue)text+=$" · Δ {profit:N0}";
      var body=new TextBlock{Text=text,FontSize=11,Foreground=Brushes.White,Margin=new Thickness(5,3,5,3)};
      var border=new Border{Child=body,Background=price.flags.Length>0?Brushes.DimGray:profit>0?Brushes.DarkGreen:Brushes.DarkSlateBlue,CornerRadius=new CornerRadius(3)};
      var win=new Window{Content=border,WindowStyle=WindowStyle.None,AllowsTransparency=true,Background=Brushes.Transparent,ShowInTaskbar=false,ShowActivated=false,Topmost=true,Focusable=false,IsHitTestVisible=false,SizeToContent=SizeToContent.WidthAndHeight};
      win.SourceInitialized+=(_,_)=>{var handle=new WindowInteropHelper(win).Handle;var style=GetWindowLongPtr(handle,-20).ToInt64();SetWindowLongPtr(handle,-20,(nint)(style|0x20|0x08000000|0x80));};
      win.Show();var hwnd=new WindowInteropHelper(win).Handle;var scale=GetDpiForWindow(hwnd)/96.0;
      SetWindowPos(hwnd,(nint)(-1),(int)item.x,(int)Math.Max(0,item.y-22*scale),(int)Math.Ceiling(win.ActualWidth*scale),(int)Math.Ceiling(win.ActualHeight*scale),0x10);
      badges.Add(win);
    }
  }
  static void SelfTest(){
    if(!Supported("https://www.neopets.com/objects.phtml?type=shop&obj_type=58")||Supported("https://evil.test/objects.phtml?type=shop&obj_type=58")||Supported("https://www.neopets.com@evil.test/inventory.phtml")||Supported("file:///inventory.phtml")||ParseCost("Cost: 12,345 NP")!=12345||ParseCost("Buy 3 items for 20 NP")!=null)throw new Exception("Overlay parser test failed.");
    Emit(new{ok=true,checks=6});
  }
}
