import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, Smartphone, GraduationCap, Sparkles, Users, Clock } from "lucide-react";
import { PageMeta } from "@/components/PageMeta";

const Guide = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10">
      <PageMeta
        title="Kolo štěstí ve výuce — průvodce pro učitele | Kolotoč!"
        description="Jak používat kolo štěstí online ve výuce: režim učitele, vlastní tajenky, mobilní ovládání přes QR kód a tipy na hry do výuky češtiny, dějepisu i cizích jazyků."
        path="/jak-hrat"
      />

      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link to="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zpět na hru
          </Button>
        </Link>

        <article className="prose prose-invert max-w-none space-y-8">
          <header>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Kolo štěstí ve výuce
            </h1>
            <p className="text-xl text-muted-foreground">
              Průvodce pro učitele, jak využít online kolo štěstí jako interaktivní
              hru do výuky — od krátké rozcvičky po celovyučovací soutěž.
            </p>
          </header>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-primary" />
              K čemu je Kolotoč dobrý
            </h2>
            <p>
              Kolotoč je česká online verze klasické televizní hry, která je
              navržená přímo pro školy. Žáci hádají tajenku, točí kolem a sbírají
              body — místo nudného opakování dostanete živou aktivitu, kterou
              zvládnou děti od první třídy až po střední školu.
            </p>
            <p>
              Hra je <strong>zdarma, bez registrace</strong> a běží přímo v
              prohlížeči na interaktivní tabuli, projektoru nebo tabletu.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              Režim učitele — vlastní tajenky pro vaši hodinu
            </h2>
            <p>
              Nejsilnější funkce pro výuku je <strong>režim učitele</strong>.
              Místo náhodných hesel zadáte tajenky, které sedí přesně na téma
              vaší hodiny:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Čeština</strong> — vyjmenovaná slova, slovní druhy, literární díla</li>
              <li><strong>Cizí jazyky</strong> — slovní zásoba, idiomy, geografické názvy</li>
              <li><strong>Dějepis</strong> — historické osobnosti, události, letopočty v textu</li>
              <li><strong>Přírodopis a zeměpis</strong> — názvy zvířat, rostlin, řek, hor</li>
              <li><strong>Matematika</strong> — názvy geometrických útvarů, jednotky</li>
            </ul>
            <p>
              Tajenku doplňte vlastní kategorií (např. „Vyjmenované slova po B")
              a hra rovnou ukáže nápovědu žákům.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Smartphone className="w-6 h-6 text-primary" />
              Mobilní ovládání přes QR kód
            </h2>
            <p>
              Nemusíte stát za katedrou. Naskenujte QR kód mobilem a telefon se
              promění v <strong>dálkové ovládání hry</strong>. Můžete chodit
              po třídě, sledovat reakce dětí a hru řídit z ruky — točit kolem,
              odhalovat písmena, posouvat tahy.
            </p>
            <p>
              Žáci sledují jen velkou obrazovku, nepotřebují žádné účty ani
              vlastní zařízení. Ideální i pro první stupeň.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              Jak rozdělit třídu na týmy
            </h2>
            <p>
              V nastavení vytvořte 2 až 4 hráče — každý reprezentuje jeden tým
              (třeba podle řad lavic nebo barev). Týmy se střídají v tazích,
              sčítají si body a o vítězi rozhoduje finálová tajenka.
            </p>
            <p>
              Mechanika <em>žetonů</em> přidává taktiku: položený žeton na
              segmentu znamená bonus, když na něj soupeř následně padne.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Clock className="w-6 h-6 text-primary" />
              Tipy do hodiny
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Rozcvička (5–10 min)</strong> — jedno kolo s krátkými hesly na opakování slovní zásoby.</li>
              <li><strong>Závěr hodiny</strong> — využijte poslední čtvrthodinu jako odměnu za odvedenou práci.</li>
              <li><strong>Suplovaná hodina</strong> — připravená tajenková sada zachrání každou „volnou" hodinu.</li>
              <li><strong>Projektový den</strong> — nastavte víc kol a nechte třídu hrát turnaj.</li>
              <li><strong>Časovač tahu</strong> — zapněte limit 15–30 s, aby hra držela tempo.</li>
            </ul>
          </section>

          <section className="space-y-4 pt-4 border-t border-border">
            <h2 className="text-2xl font-semibold">Spustit hru</h2>
            <p>
              Kolotoč je hra do výuky, kterou nemusíte instalovat — stačí
              otevřít prohlížeč na tabuli a začít.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/">
                <Button size="lg">
                  <Play className="w-4 h-4 mr-2" />
                  Spustit hru
                </Button>
              </Link>
              <Link to="/host">
                <Button size="lg" variant="outline">
                  <Smartphone className="w-4 h-4 mr-2" />
                  Hrát s mobilním ovládáním
                </Button>
              </Link>
            </div>
          </section>
        </article>
      </div>
    </div>
  );
};

export default Guide;