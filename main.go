package main

import(
  "fmt"
  "net/http"
  "time"

  "github.com/droundy/goopt"
  "github.com/fatih/color"
  "github.com/PuerkitoBio/fetchbot"
  "github.com/PuerkitoBio/goquery"
)

var (
  baseUrl = goopt.String([]string{"-u", "--url"}, "", "URL of the web page to check")
  urlsChecked = map[string]bool{}

)

func main ()  {
  goopt.Parse(nil)

  f:= fetchbot.New(fetchbot.HandlerFunc(handler))
  f.AutoClose = true
  f.CrawlDelay = 500 * time.Millisecond
  f.WorkerIdleTTL = time.Second

  queue := f.Start()
  queue.SendStringGet(*baseUrl)

  urlsChecked[*baseUrl] = true
  queue.Block()
}

func handler(ctx *fetchbot.Context, res *http.Response, err error) {
    if err != nil {
        out := color.New(color.FgRed)
        out.Printf("[ BROKEN ] %s\n", err)
        return
    }

    doc, err := goquery.NewDocumentFromResponse(res)
    addFoundLinks(ctx, doc)

    out := color.New(color.FgGreen)
    out.Printf("[   OK   ] %s\n", ctx.Cmd.URL())
}

func addFoundLinks(ctx *fetchbot.Context, doc *goquery.Document) {
  doc.Find("a[href]").Each(func(i int, s *goquery.Selection) {
    val, _ := s.Attr("href")

    u, err := ctx.Cmd.URL().Parse(val)

    if err != nil {
      fmt.Printf("error: resolve URL %s - %s\n", val, err)
      return
    }

    parsedBaseUrl, err := ctx.Cmd.URL().Parse(*baseUrl)

    if u.Host == parsedBaseUrl.Host {

      if !urlsChecked[u.String()] {
        ctx.Q.SendStringGet(u.String())
        urlsChecked[u.String()] = true
      }
    }
  })
}
