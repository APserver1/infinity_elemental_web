import React, { createContext, useContext, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  NavLink,
  useNavigate,
  useParams,
  useLocation,
} from "react-router-dom";
import {
  Menu,
  X,
  ArrowUpRight,
  ArrowRight,
  Download,
  ChevronRight,
  Box,
  Compass,
  Leaf,
  Layers,
  ExternalLink,
  UserRound,
  LogOut,
  Shield,
  Plus,
  ImagePlus,
  Trash2,
  Check,
  LoaderCircle,
  Mountain,
  Globe,
  Mail,
  Bug,
  ChevronDown,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import {
  backend,
  uploadBuild,
  check,
  message,
  type Profile,
  type Release,
  type Asset,
} from "./backend";
import "./style.css";
import "./hero.css";
import "./motion.css";
import { useScrollMotion } from "./motion";
import { BrandCube } from "./BrandCube";
type User = { id: string; email?: string };
type AuthState = {
  user: User | null;
  profile: Profile | null;
  admin: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
};
const Auth = createContext<AuthState>({
  user: null,
  profile: null,
  admin: false,
  loading: true,
  refresh: async () => {},
});
const useAuth = () => useContext(Auth);
function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Omit<AuthState, "refresh">>({
    user: null,
    profile: null,
    admin: false,
    loading: true,
  });
  async function refresh() {
    try {
      const r = await backend.auth.getCurrentUser();
      if (r.error) throw r.error;
      const user = r.data?.user as User | null;
      if (!user) {
        setState({ user: null, profile: null, admin: false, loading: false });
        return;
      }
      const [p, a] = await Promise.all([
        backend.database
          .from("ie_profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle(),
        backend.database
          .from("ie_admins")
          .select("user_id")
          .eq("user_id", user.id),
      ]);
      setState({
        user,
        profile: p.data as Profile | null,
        admin: !a.error && !!a.data?.length,
        loading: false,
      });
    } catch {
      setState({ user: null, profile: null, admin: false, loading: false });
    }
  }
  useEffect(() => {
    void refresh();
  }, []);
  return (
    <Auth.Provider value={{ ...state, refresh }}>{children}</Auth.Provider>
  );
}
function Notice({ error, text }: { error?: string; text?: string }) {
  return error || text ? (
    <div
      role={error ? "alert" : "status"}
      className={`notice ${error ? "error" : "success"}`}
    >
      {error || text}
    </div>
  ) : null;
}
function Loading() {
  return (
    <div className="loading">
      <LoaderCircle className="spin" /> Cargando…
    </div>
  );
}
function Layout() {
  const location = useLocation();
  const motionRoot = useScrollMotion(location.pathname);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  const [menu, setMenu] = useState(false);
  const auth = useAuth();
  return (
    <>
      <header className="navbar">
        <div className="nav-left">
          <button
            className="icon-button menu-button"
            aria-label="Abrir menú"
            aria-expanded={menu}
            onClick={() => setMenu(true)}
          >
            <Menu size={21} />
          </button>
          <Link to="/" className="brand">
            <span className="brand-mark">
              <BrandCube />
            </span>
            <span>
              INFINITY <strong>ELEMENTAL</strong>
            </span>
          </Link>
        </div>
        <nav className="desktop-nav">
          <NavLink to="/" end>
            Inicio
          </NavLink>
          <NavLink to="/el-juego">El juego</NavLink>
          <NavLink to="/versiones">Desarrollo</NavLink>
          <NavLink to="/comunidad">Comunidad</NavLink>
        </nav>
        <div className="nav-right">
          <Link className="account-link" to={auth.user ? "/perfil" : "/login"}>
            <UserRound size={17} />
            <span>{auth.user ? "Mi perfil" : "Iniciar sesión"}</span>
          </Link>
          <Link className="button small" to="/descargas">
            <Download size={16} /> Descargas
          </Link>
        </div>
      </header>
      {menu && (
        <div className="drawer-overlay" onClick={() => setMenu(false)}>
          <aside className="drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-title">
              Explora Infinity{" "}
              <button
                className="icon-button"
                aria-label="Cerrar menú"
                onClick={() => setMenu(false)}
              >
                <X />
              </button>
            </div>
            {[
              ["/", "Inicio"],
              ["/el-juego", "El juego"],
              ["/descargas", "Descargas"],
              ["/versiones", "Diario de desarrollo"],
              ["/galeria", "Galería"],
              ["/comunidad", "Comunidad"],
              ["/soporte", "Soporte y bugs"],
              [
                auth.user ? "/perfil" : "/registro",
                auth.user ? "Mi perfil" : "Crear cuenta",
              ],
              ...(auth.admin ? [["/admin", "Administración"]] : []),
            ].map(([to, label]) => (
              <Link key={to} to={to} onClick={() => setMenu(false)}>
                {label}
                <ArrowUpRight size={18} />
              </Link>
            ))}
            <p>
              Un mundo por descubrir.
              <br />
              Una historia que construimos juntos.
            </p>
          </aside>
        </div>
      )}
      <main ref={motionRoot}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/el-juego" element={<Game />} />
          <Route path="/galeria" element={<Gallery />} />
          <Route path="/comunidad" element={<Community />} />
          <Route
            path="/descargas"
            element={
              <ReleaseAccess purpose="download">
                <Releases downloads />
              </ReleaseAccess>
            }
          />
          <Route
            path="/versiones"
            element={
              <ReleaseAccess purpose="versions">
                <Releases />
              </ReleaseAccess>
            }
          />
          <Route
            path="/versiones/:id"
            element={
              <ReleaseAccess purpose="detail">
                <ReleaseDetail />
              </ReleaseAccess>
            }
          />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/registro" element={<AuthPage register />} />
          <Route path="/recuperar" element={<Recovery />} />
          <Route path="/verificar" element={<Verification />} />
          <Route
            path="/perfil"
            element={
              <Protected>
                <ProfilePage />
              </Protected>
            }
          />
          <Route path="/soporte" element={<Support />} />
          <Route
            path="/admin"
            element={
              <Protected admin>
                <Admin />
              </Protected>
            }
          />
          <Route path="/privacidad" element={<Privacy />} />
          <Route
            path="*"
            element={
              <section className="page narrow">
                <h1>Este camino aún no existe.</h1>
                <Link className="button" to="/">
                  Volver al inicio
                </Link>
              </section>
            }
          />
        </Routes>
      </main>
      <footer data-motion-group>
        <div data-reveal="rise">
          <Link to="/" className="brand">
            <BrandCube />
            <span>
              INFINITY <strong>ELEMENTAL</strong>
            </span>
          </Link>
          <p>Un mundo de posibilidades, bloque a bloque.</p>
        </div>
        <div className="footer-links" data-reveal="rise">
          <Link to="/soporte">Soporte</Link>
          <Link to="/privacidad">Privacidad</Link>
          <a
            href="https://www.threads.com/@ap.multiverse"
            target="_blank"
            rel="noreferrer"
          >
            Threads <ArrowUpRight size={14} />
          </a>
        </div>
        <span className="copyright" data-reveal="rise">
          © {new Date().getFullYear()} AP Multiverse · Hecho con Godot
        </span>
      </footer>
    </>
  );
}
function Home() {
  return (
    <>
      <section className="hero">
        <img
          className="hero-image"
          src="/images/mountains.png"
          alt="Cordillera cubierta de vegetación en Infinity Elemental"
        />
        <div className="hero-shade" />
        <div className="world-light" aria-hidden="true" />
        <div className="world-reveal" aria-hidden="true">
          {Array.from({ length: 32 }, (_, i) => (
            <span
              key={i}
              style={
                {
                  "--reveal-delay": `${(i % 8) * 0.055 + Math.floor(i / 8) * 0.085}s`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
        <div className="world-sparks" aria-hidden="true">
          {Array.from({ length: 9 }, (_, i) => (
            <span
              key={i}
              style={
                {
                  left: `${8 + i * 10}%`,
                  top: `${26 + ((i * 17) % 53)}%`,
                  "--spark-delay": `${0.5 + i * 0.12}s`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="sr-only">Infinity Elemental</span>
            <img
              className="hero-logo"
              src="/images/logo.png"
              alt=""
              fetchPriority="high"
              width="2048"
              height="512"
            />
            <span className="logo-fragments" aria-hidden="true">
              {Array.from({ length: 12 }, (_, i) => {
                const col = i % 6;
                const row = Math.floor(i / 6);
                return (
                  <img
                    key={i}
                    src="/images/logo.png"
                    alt=""
                    width="2048"
                    height="512"
                    style={
                      {
                        clipPath: `inset(${row * 50}% ${100 - ((col + 1) * 100) / 6}% ${50 - row * 50}% ${(col * 100) / 6}%)`,
                        "--fragment-x": `${(col - 2.5) * 28}px`,
                        "--fragment-y": `${row === 0 ? -65 : 65}px`,
                        "--fragment-delay": `${0.35 + col * 0.065 + row * 0.09}s`,
                      } as React.CSSProperties
                    }
                  />
                );
              })}
            </span>
          </h1>
          <div className="hero-tagline">
            Un mundo infinito. Tu propia aventura.
          </div>
          <p>
            Explora, crea y deja tu huella en Infinity Elemental.
            <br className="desktop-break" /> Un sandbox cúbico donde cada bloque
            es un nuevo comienzo.
          </p>
          <div className="hero-actions">
            <Link className="button" to="/descargas">
              <Download size={18} /> Explorar las betas{" "}
              <ArrowUpRight size={17} />
            </Link>
            <Link className="button glass" to="/el-juego">
              Descubre el juego <ArrowRight size={18} />
            </Link>
          </div>
          <div className="hero-meta">
            <span>
              <Box size={15} /> Sandbox cúbico
            </span>
            <i />
            <span>Desarrollado en Godot</span>
            <i />
            <span className="green">
              <span className="status-dot" /> En desarrollo
            </span>
          </div>
        </div>
        <div className="hero-bottom">
          <span>
            CAPTURA REAL DEL JUEGO <span className="tiny-square" />
          </span>
          <a href="#descubre">
            SCROLL PARA EXPLORAR <ChevronDown size={16} />
          </a>
        </div>
        <span className="hero-coordinate">IE / WORLD_001</span>
      </section>
      <div className="world-strip" data-motion-group>
        <span data-reveal="rise">LA AVENTURA APENAS COMIENZA</span>
        <div data-reveal="rise">
          <span className="status-dot" /> Desarrollo activo
        </div>
        <p data-reveal="rise">
          Crece con el mundo. Forma parte de lo que viene.
        </p>
        <Link to="/versiones" data-reveal="rise">
          Sigue el desarrollo <ArrowRight size={17} />
        </Link>
      </div>
      <section id="descubre" className="section">
        <div className="section-heading" data-motion-group>
          <div data-reveal="copy">
            <span className="eyebrow">HECHO PARA DESCUBRIR</span>
            <h2>
              Más que bloques.
              <br />
              Un mundo de posibilidades.
            </h2>
          </div>
          <p data-reveal="right">
            Un proyecto independiente que encuentra su identidad
            <br className="desktop-break" /> en la exploración, la naturaleza y
            la libertad de crear.
          </p>
        </div>
        <div className="feature-grid" data-motion-group>
          <Link
            to="/el-juego#exploracion"
            className="feature-card"
            data-reveal="card"
          >
            <img
              src="/images/mountains.png"
              alt="Montañas y valles"
              loading="lazy"
            />
            <div className="feature-content">
              <span className="feature-icon">
                <Compass size={20} />
              </span>
              <span className="card-index">01 / EXPLORACIÓN</span>
              <h3>Siempre hay un nuevo horizonte.</h3>
              <p>
                Montañas, valles y caminos que invitan a ir un poco más lejos.
              </p>
              <span className="round-arrow">
                <ArrowUpRight size={20} />
              </span>
            </div>
          </Link>
          <Link
            to="/el-juego#naturaleza"
            className="feature-card"
            data-reveal="card"
          >
            <img
              src="/images/river.png"
              alt="Río entre árboles y flores"
              loading="lazy"
            />
            <div className="feature-content">
              <span className="feature-icon">
                <Leaf size={20} />
              </span>
              <span className="card-index">02 / NATURALEZA</span>
              <h3>Un mundo lleno de detalles.</h3>
              <p>Vegetación, agua y paisajes que dan carácter a cada rincón.</p>
              <span className="round-arrow">
                <ArrowUpRight size={20} />
              </span>
            </div>
          </Link>
          <Link
            to="/el-juego#creacion"
            className="feature-card"
            data-reveal="card"
          >
            <img
              src="/images/meadow.png"
              alt="Pradera cúbica con flores"
              loading="lazy"
            />
            <div className="feature-content">
              <span className="feature-icon">
                <Layers size={20} />
              </span>
              <span className="card-index">03 / LIBERTAD</span>
              <h3>El siguiente bloque es tuyo.</h3>
              <p>
                Un sandbox en desarrollo, pensado para explorar y crear a tu
                manera.
              </p>
              <span className="round-arrow">
                <ArrowUpRight size={20} />
              </span>
            </div>
          </Link>
        </div>
      </section>
      <section className="development section" data-motion-group>
        <div data-reveal="copy">
          <span className="eyebrow">BLOQUE A BLOQUE</span>
          <h2>
            El mundo evoluciona.
            <br />
            Tú puedes ser parte.
          </h2>
          <p>
            Sigue los avances, conoce los cambios de cada versión y comparte lo
            que encuentres en el camino.
          </p>
          <Link className="text-link" to="/versiones">
            Ver el diario de desarrollo <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="dev-panel" data-reveal="panel">
          <span className="eyebrow">
            <span className="status-dot" /> PROYECTO EN DESARROLLO
          </span>
          <h3>
            Una nueva aventura
            <br />
            se está construyendo.
          </h3>
          <p>
            Las betas y sus notas aparecerán aquí cuando el equipo las publique.
          </p>
          <Link className="button glass" to="/descargas">
            Centro de descargas <Download size={17} />
          </Link>
          <Box className="panel-cube" size={140} strokeWidth={0.7} />
        </div>
      </section>
      <section className="community-banner" data-reveal="banner">
        <div data-reveal="copy">
          <span className="eyebrow">CONSTRUYAMOS LO QUE VIENE</span>
          <h2>
            Tu próxima aventura
            <br />
            empieza con la comunidad.
          </h2>
          <p>Comparte ideas, sigue el proyecto y ayúdanos a mejorar.</p>
        </div>
        <Link className="button" to="/registro">
          Únete al mundo <ArrowUpRight size={18} />
        </Link>
      </section>
    </>
  );
}
function PageIntro({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="page-intro" data-reveal="intro">
      <span className="eyebrow">{label}</span>
      <h1>{title}</h1>
      {children && <p>{children}</p>}
    </div>
  );
}
function Game() {
  return (
    <section className="page">
      <PageIntro
        label="EL UNIVERSO INFINITY ELEMENTAL"
        title="Tu imaginación, un bloque más allá."
      >
        Un sandbox cúbico independiente desarrollado en Godot. Estas imágenes
        muestran el estado del proyecto; sus sistemas continúan evolucionando.
      </PageIntro>
      {[
        [
          "exploracion",
          "01 / EXPLORACIÓN",
          "Persigue el horizonte.",
          "Recorre montañas y valles de geometría cúbica. El terreno y sus paisajes son parte de un mundo que seguimos construyendo.",
          "mountains.png",
        ],
        [
          "naturaleza",
          "02 / NATURALEZA",
          "Los pequeños detalles cambian el mundo.",
          "Ríos, árboles, flores y vegetación dan vida a los escenarios. Explora las capturas para descubrir el trabajo visual del proyecto.",
          "river.png",
        ],
        [
          "creacion",
          "03 / LIBERTAD",
          "Un espacio para tus ideas.",
          "Infinity Elemental nace como un sandbox: queremos dar espacio a la exploración y la creatividad. Las capacidades disponibles de cada beta se documentarán en sus notas de versión.",
          "meadow.png",
        ],
      ].map(([id, label, title, body, img]) => (
        <article className="game-section" id={id} key={id} data-motion-group>
          <div className="landscape-frame" data-reveal="landscape">
            <img src={"/images/" + img} alt={title} loading="lazy" />
          </div>
          <div data-reveal="copy">
            <span className="eyebrow">{label}</span>
            <h2>{title}</h2>
            <p>{body}</p>
          </div>
        </article>
      ))}
      <Link className="button" to="/galeria" data-reveal="rise">
        Explorar la galería <ArrowUpRight size={18} />
      </Link>
    </section>
  );
}
function Gallery() {
  const [active, setActive] = useState<string | null>(null);
  const images = ["mountains.png", "river.png", "meadow.png"];
  return (
    <section className="page">
      <PageIntro
        label="VENTANAS A NUESTRO MUNDO"
        title="Así se ve Infinity Elemental."
      >
        Capturas reales del desarrollo. Un vistazo a los paisajes que estamos
        creando.
      </PageIntro>
      <div className="gallery-grid" data-motion-group>
        {images.map((src, i) => (
          <button
            onClick={() => setActive(src)}
            key={src}
            data-reveal="landscape"
          >
            <img
              src={"/images/" + src}
              alt={
                ["Montañas y valles", "Río y vegetación", "Pradera con flores"][
                  i
                ]
              }
            />
            <span>
              {
                [
                  "Un nuevo horizonte",
                  "La vida entre bloques",
                  "Detalles de la pradera",
                ][i]
              }
              <ArrowUpRight size={18} />
            </span>
          </button>
        ))}
      </div>
      {active && (
        <div
          className="lightbox"
          role="dialog"
          aria-label="Captura ampliada"
          onClick={() => setActive(null)}
        >
          <button className="icon-button" aria-label="Cerrar imagen">
            <X />
          </button>
          <img
            src={"/images/" + active}
            alt="Captura ampliada de Infinity Elemental"
          />
        </div>
      )}
    </section>
  );
}
function Community() {
  return (
    <section className="page">
      <PageIntro label="EL MUNDO LO HACEMOS JUNTOS" title="Encuentra tu lugar.">
        Sigue los avances del proyecto, comparte tus ideas y participa en las
        próximas betas.
      </PageIntro>
      <div className="info-grid" data-motion-group>
        <a
          className="panel"
          data-reveal="community"
          href="https://www.threads.com/@ap.multiverse"
          target="_blank"
          rel="noreferrer"
        >
          <Globe />
          <h2>El día a día en Threads</h2>
          <p>
            Encuentra las publicaciones originales del desarrollo en
            @ap.multiverse.
          </p>
          <span className="text-link">
            Seguir el proyecto <ExternalLink size={18} />
          </span>
        </a>
        <Link className="panel" data-reveal="community" to="/registro">
          <UserRound />
          <h2>Tu identidad en el mundo</h2>
          <p>
            Crea tu perfil y reserva tu nickname para la futura integración con
            el juego.
          </p>
          <span className="text-link">
            Crear cuenta <ArrowRight size={18} />
          </span>
        </Link>
        <Link className="panel" data-reveal="community" to="/soporte">
          <Bug />
          <h2>Ayúdanos a mejorar</h2>
          <p>Encontraste un error en una beta: cuéntanos cómo reproducirlo.</p>
          <span className="text-link">
            Reportar un bug <ArrowRight size={18} />
          </span>
        </Link>
      </div>
    </section>
  );
}
function useReleases(all = false) {
  const [items, setItems] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  async function load() {
    setLoading(true);
    setError("");
    try {
      let q = backend.database
        .from("ie_releases")
        .select("*")
        .order("created_at", { ascending: false });
      if (!all) q = q.eq("status", "published");
      setItems(check(await q) as Release[]);
    } catch (e) {
      setError(message(e));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, [all]);
  return { items, loading, error, load };
}
function Releases({ downloads = false }: { downloads?: boolean }) {
  const { items, loading, error, load } = useReleases();
  return (
    <section className="page">
      <PageIntro
        label={downloads ? "TU PRÓXIMO MUNDO" : "DIARIO DE DESARROLLO"}
        title={
          downloads
            ? "Descargas y betas."
            : "Cada versión, una nueva posibilidad."
        }
      >
        {downloads
          ? "Encuentra las versiones publicadas y los archivos para tu plataforma. Consulta sus notas antes de jugar."
          : "Conoce las novedades, las mejoras y los cambios del proyecto."}
      </PageIntro>
      <div className="beta-notice" data-reveal="left">
        <Shield size={20} />
        <p>
          Infinity Elemental está en desarrollo. Las betas pueden contener
          errores; guarda una copia de tus mundos antes de actualizar.
        </p>
      </div>
      <Notice error={error} />
      {error && (
        <button className="button glass" onClick={load}>
          Reintentar
        </button>
      )}
      {loading ? (
        <Loading />
      ) : items.length ? (
        <div className="release-grid" data-motion-group>
          {items.map((r, i) => (
            <Link
              to={"/versiones/" + r.id}
              className="release-card"
              key={r.id}
              data-reveal="release"
            >
              <img src={r.cover_url || "/images/river.png"} alt={r.title} />
              <div>
                <span className="tag">
                  {i === 0 ? "ÚLTIMA PUBLICACIÓN" : "VERSIÓN"} · {r.version}
                </span>
                <h2>{r.title}</h2>
                <p>{r.summary}</p>
                <span className="text-link">
                  {downloads
                    ? "Ver archivos y descargar"
                    : "Leer las novedades"}{" "}
                  <ArrowUpRight size={17} />
                </span>
                <small>
                  {new Date(r.published_at || r.created_at).toLocaleDateString(
                    "es",
                  )}
                </small>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        !error && (
          <div className="empty" data-reveal="panel">
            <Box size={44} />
            <h2>Los próximos pasos se publican aquí.</h2>
            <p>
              Todavía no hay versiones publicadas. Vuelve pronto o sigue los
              avances en Threads.
            </p>
            <a
              className="button glass"
              href="https://www.threads.com/@ap.multiverse"
              target="_blank"
              rel="noreferrer"
            >
              Seguir el desarrollo <ArrowUpRight size={18} />
            </a>
          </div>
        )
      )}
    </section>
  );
}
function ReleaseDetail() {
  const { id } = useParams();
  const [release, setRelease] = useState<Release | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        setRelease(
          check(
            await backend.database
              .from("ie_releases")
              .select("*")
              .eq("id", id!)
              .single(),
          ) as Release,
        );
        setAssets(
          check(
            await backend.database
              .from("ie_release_assets")
              .select("*")
              .eq("release_id", id!),
          ) as Asset[],
        );
      } catch (e) {
        setError(message(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);
  return (
    <section className="page article-page">
      <Link className="text-link" to="/versiones">
        ← Todas las versiones
      </Link>
      {loading ? (
        <Loading />
      ) : release ? (
        <>
          <PageIntro label={"VERSIÓN " + release.version} title={release.title}>
            {release.summary}
          </PageIntro>
          <a className="button release-files-shortcut" href="#archivos">
            <Download size={18} /> Ir a los archivos <ChevronDown size={18} />
          </a>
          <img
            className="article-cover"
            data-reveal="landscape"
            src={release.cover_url || "/images/river.png"}
            alt={release.title}
          />
          <div className="markdown" data-reveal="copy">
            <ReactMarkdown>{release.content}</ReactMarkdown>
          </div>
          <div
            className="panel"
            data-reveal="rise"
            id="archivos"
            tabIndex={-1}
            aria-labelledby="archivos-titulo"
          >
            <h2 id="archivos-titulo">Archivos de esta versión</h2>
            {assets.length ? (
              assets.map((a) => (
                <a
                  className="download-row"
                  href={a.url}
                  key={a.id}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span>
                    <strong>{a.platform}</strong>
                    <small>
                      {a.name} · {(a.size / 1024 / 1024).toFixed(1)} MB
                    </small>
                  </span>
                  <Download size={22} />
                </a>
              ))
            ) : (
              <p>Esta publicación todavía no tiene archivos de descarga.</p>
            )}
          </div>
          <Link className="text-link" to="/soporte">
            Reportar un problema con esta versión <Bug size={17} />
          </Link>
        </>
      ) : (
        <Notice error={error || "Publicación no encontrada."} />
      )}
    </section>
  );
}
function ReleaseAccess({
  children,
  purpose,
}: {
  children: React.ReactNode;
  purpose: "versions" | "download" | "detail";
}) {
  const auth = useAuth();
  const location = useLocation();
  if (auth.loading) return <Loading />;
  if (auth.user) return <>{children}</>;
  const title =
    purpose === "versions"
      ? "Inicia sesión para ver las versiones."
      : purpose === "detail"
        ? "Inicia sesión para ver y descargar esta versión."
        : "Inicia sesión para descargar el juego.";
  const returnTo = location.pathname + location.search + location.hash;
  return (
    <section className="page narrow">
      <PageIntro label="TU PRÓXIMA AVENTURA" title={title}>
        Necesitas una cuenta y una sesión activa para acceder a las versiones
        del juego y sus descargas.
      </PageIntro>
      <div
        className="panel release-access"
        aria-labelledby="release-access-title"
        data-reveal="panel"
      >
        <Shield size={32} aria-hidden="true" />
        <h2 id="release-access-title">Tu aventura empieza con una cuenta.</h2>
        <p>
          Inicia sesión para continuar. Si todavía no tienes cuenta, puedes
          registrarte aquí.
        </p>
        <div className="release-access-actions">
          <Link className="button" to="/login" state={{ returnTo }}>
            <UserRound size={18} /> Iniciar sesión <ArrowRight size={18} />
          </Link>
          <Link className="button glass" to="/registro" state={{ returnTo }}>
            Crear una cuenta
          </Link>
        </div>
      </div>
    </section>
  );
}
function authDestination(state: unknown): string {
  const path = (state as { returnTo?: unknown } | null)?.returnTo;
  return typeof path === "string" &&
    /^\/(?:versiones|descargas)(?:[/?#]|$)/.test(path)
    ? path
    : "/perfil";
}
function Protected({
  children,
  admin = false,
}: {
  children: React.ReactNode;
  admin?: boolean;
}) {
  const auth = useAuth();
  if (auth.loading) return <Loading />;
  if (!auth.user)
    return (
      <section className="page narrow">
        <PageIntro label="TU CUENTA" title="Inicia sesión para continuar." />
        <Link className="button" to="/login">
          Iniciar sesión <ArrowRight size={18} />
        </Link>
      </section>
    );
  if (admin && !auth.admin)
    return (
      <section className="page narrow">
        <PageIntro
          label="ACCESO RESTRINGIDO"
          title="Solo para administradores."
        />
        Tu cuenta no tiene permisos de administración.
      </section>
    );
  return <>{children}</>;
}
function AuthPage({ register = false }: { register?: boolean }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const destination = authDestination(location.state);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(
    new URLSearchParams(window.location.search).get("insforge_status") ===
      "success"
      ? "Correo verificado. Ya puedes iniciar sesión."
      : "",
  );
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const email = String(f.get("email"));
      const password = String(f.get("password"));
      if (register) {
        const nickname = String(f.get("nickname"));
        const r = check(
          await backend.auth.signUp({
            email,
            password,
            name: nickname,
            redirectTo: window.location.origin + "/login",
          }),
        );
        if (r?.user && r.accessToken) {
          check(
            await backend.database.from("ie_profiles").upsert({
              id: r.user.id,
              nickname,
              display_name: nickname,
              bio: "",
            }),
          );
          await auth.refresh();
          navigate(destination);
        } else {
          sessionStorage.setItem("ie_pending_email", email);
          navigate("/verificar", { state: { returnTo: destination } });
        }
      } else {
        check(await backend.auth.signInWithPassword({ email, password }));
        await auth.refresh();
        navigate(destination);
      }
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="auth-page">
      <div className="auth-art" data-reveal="landscape">
        <img src="/images/river.png" alt="Río de Infinity Elemental" />
        <div>
          <Box size={42} />
          <h2>
            Tu lugar en un
            <br />
            mundo infinito.
          </h2>
          <p>La aventura empieza contigo.</p>
        </div>
      </div>
      <div className="auth-form" data-reveal="right">
        <PageIntro
          label="INFINITY ELEMENTAL"
          title={register ? "Empieza tu aventura." : "Bienvenido de nuevo."}
        >
          {register
            ? "Crea tu cuenta y forma parte del proyecto."
            : "Tu mundo te está esperando."}
        </PageIntro>
        <form onSubmit={submit}>
          {register && (
            <label>
              Nickname en el juego
              <input
                name="nickname"
                autoComplete="nickname"
                required
                minLength={3}
                maxLength={24}
                pattern="[a-zA-Z0-9_]{3,24}"
                placeholder="Tu nombre entre bloques"
              />
              <small>3–24 letras, números o guiones bajos.</small>
            </label>
          )}
          <label>
            Correo electrónico
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="tu@correo.com"
            />
          </label>
          <label>
            Contraseña
            <input
              name="password"
              type="password"
              autoComplete={register ? "new-password" : "current-password"}
              required
              minLength={8}
              maxLength={128}
              placeholder="Al menos 8 caracteres"
            />
          </label>
          {register && (
            <label className="checkbox">
              <input type="checkbox" required />
              He leído la <Link to="/privacidad">política de privacidad</Link>.
            </label>
          )}
          <Notice error={error} text={success} />
          <button className="button" disabled={busy}>
            {busy ? (
              <LoaderCircle className="spin" size={18} />
            ) : (
              <ArrowRight size={18} />
            )}{" "}
            {register ? "Crear mi cuenta" : "Iniciar sesión"}
          </button>
        </form>
        {!register && (
          <Link className="text-link" to="/recuperar">
            Olvidé mi contraseña
          </Link>
        )}
        <p className="auth-switch">
          {register ? "¿Ya tienes cuenta?" : "¿Aún no tienes cuenta?"}{" "}
          <Link
            to={register ? "/login" : "/registro"}
            state={{ returnTo: destination }}
          >
            {register ? "Inicia sesión" : "Regístrate"}
          </Link>
        </p>
      </div>
    </section>
  );
}
function Verification() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState(
    sessionStorage.getItem("ie_pending_email") || "",
  );
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const f = new FormData(e.currentTarget);
      check(
        await backend.auth.verifyEmail({ email, otp: String(f.get("otp")) }),
      );
      sessionStorage.removeItem("ie_pending_email");
      await auth.refresh();
      navigate(authDestination(location.state));
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="page narrow">
      <PageIntro label="TU CUENTA" title="Verifica tu correo.">
        Introduce el código recibido por correo. Si recibiste un enlace, ábrelo
        para verificar la cuenta y después inicia sesión.
      </PageIntro>
      <form data-reveal="rise" className="panel" onSubmit={submit}>
        <label>
          Correo electrónico
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label>
          Código de verificación
          <input
            name="otp"
            required
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
          />
        </label>
        <Notice error={error} text={success} />
        <button className="button" disabled={busy}>
          Verificar cuenta
        </button>
        <button
          type="button"
          className="text-link"
          style={{ marginLeft: 20 }}
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              check(
                await backend.auth.resendVerificationEmail({
                  email,
                  redirectTo: window.location.origin + "/login",
                }),
              );
              setSuccess("Correo de verificación solicitado.");
            } catch (e) {
              setError(message(e));
            } finally {
              setBusy(false);
            }
          }}
        >
          Reenviar correo
        </button>
      </form>
    </section>
  );
}
function Recovery() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const params = new URLSearchParams(window.location.search);
  const [token, setToken] = useState(
    params.get("insforge_status") === "ready" ? params.get("token") : null,
  );
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const f = new FormData(e.currentTarget);
      if (token) {
        check(
          await backend.auth.resetPassword({
            newPassword: String(f.get("password")),
            otp: token,
          }),
        );
        setSuccess("Contraseña actualizada. Ya puedes iniciar sesión.");
      } else if (sent) {
        const r = check(
          await backend.auth.exchangeResetPasswordToken({
            email,
            code: String(f.get("code")),
          }),
        );
        setToken(r!.token);
        setSuccess("Código verificado. Elige una nueva contraseña.");
      } else {
        check(
          await backend.auth.sendResetPasswordEmail({
            email,
            redirectTo: window.location.origin + "/recuperar",
          }),
        );
        setSent(true);
        setSuccess(
          "Si existe una cuenta con ese correo, recibirás un código o un enlace para recuperar el acceso.",
        );
      }
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="page narrow">
      <PageIntro
        label="TU CUENTA"
        title={token ? "Nueva contraseña." : "Recupera tu acceso."}
      />
      <form data-reveal="rise" className="panel" onSubmit={submit}>
        {token ? (
          <label>
            Nueva contraseña
            <input
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </label>
        ) : (
          <>
            <label>
              Correo electrónico
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                readOnly={sent}
              />
            </label>
            {sent && (
              <label>
                Código recibido por correo
                <input
                  name="code"
                  required
                  pattern="[0-9]{6}"
                  inputMode="numeric"
                  maxLength={6}
                />
              </label>
            )}
          </>
        )}
        <Notice
          error={error || params.get("insforge_error") || ""}
          text={success}
        />
        <button className="button" disabled={busy}>
          Continuar <ArrowRight size={18} />
        </button>
        <Link to="/login" className="text-link" style={{ marginLeft: 20 }}>
          Volver a iniciar sesión
        </Link>
      </form>
    </section>
  );
}
function ProfilePage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const f = new FormData(e.currentTarget);
      check(
        await backend.database.from("ie_profiles").upsert({
          id: auth.user!.id,
          nickname: String(f.get("nickname")),
          display_name: String(f.get("display_name")),
          bio: String(f.get("bio")),
        }),
      );
      await auth.refresh();
      setSuccess("Tu perfil se ha guardado.");
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="page narrow">
      <PageIntro label="TU IDENTIDAD" title="Tu perfil de explorador." />
      <div className="profile-card" data-reveal="panel">
        <div className="avatar">
          {(auth.profile?.nickname || auth.user?.email || "E")[0].toUpperCase()}
        </div>
        <div>
          <h2>{auth.profile?.nickname || "Nuevo explorador"}</h2>
          <p>{auth.user?.email}</p>
          {auth.admin && (
            <Link className="text-link" to="/admin">
              <Shield size={16} /> Administración
            </Link>
          )}
        </div>
      </div>
      <form
        data-reveal="rise"
        className="panel"
        onSubmit={submit}
        key={auth.profile?.id}
      >
        <label>
          Nickname en el juego
          <input
            name="nickname"
            required
            minLength={3}
            maxLength={24}
            pattern="[a-zA-Z0-9_]{3,24}"
            defaultValue={auth.profile?.nickname || ""}
          />
          <small>
            Único, de 3 a 24 caracteres. Preparado para la futura integración
            con el juego.
          </small>
        </label>
        <label>
          Nombre visible
          <input
            name="display_name"
            required
            maxLength={60}
            defaultValue={auth.profile?.display_name || ""}
          />
        </label>
        <label>
          Sobre ti
          <textarea
            name="bio"
            maxLength={500}
            rows={4}
            defaultValue={auth.profile?.bio || ""}
          />
        </label>
        <Notice error={error} text={success} />
        <button className="button" disabled={busy}>
          <Check size={18} /> Guardar perfil
        </button>
      </form>
      <button
        className="text-link logout"
        onClick={async () => {
          await backend.auth.signOut();
          await auth.refresh();
          navigate("/");
        }}
      >
        <LogOut size={17} /> Cerrar sesión
      </button>
    </section>
  );
}
function Support() {
  const auth = useAuth();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const { items } = useReleases();
  const [reports, setReports] = useState<Record<string, string>[]>([]);
  async function loadReports() {
    if (auth.user) {
      const r = await backend.database
        .from("ie_bug_reports")
        .select("id,title,status,created_at")
        .eq("user_id", auth.user.id)
        .order("created_at", { ascending: false });
      if (!r.error) setReports(r.data as Record<string, string>[]);
    }
  }
  useEffect(() => {
    void loadReports();
  }, [auth.user?.id]);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const f = new FormData(form);
      let attachment_url: null | string = null;
      const file = f.get("attachment") as File;
      if (file?.size) {
        if (file.size > 10 * 1024 * 1024)
          throw Error("La captura no puede superar 10 MB.");
        const uploaded = check(
          await backend.storage
            .from("ie-bug-attachments")
            .upload(
              `${auth.user!.id}/${crypto.randomUUID()}.${file.name.split(".").pop()}`,
              file,
            ),
        );
        attachment_url = uploaded!.url;
      }
      check(
        await backend.database.from("ie_bug_reports").insert({
          user_id: auth.user!.id,
          title: String(f.get("title")),
          description: String(f.get("description")),
          steps: String(f.get("steps")),
          platform: String(f.get("platform")),
          release_id: String(f.get("release_id")) || null,
          attachment_url,
        }),
      );
      setSuccess("Reporte enviado. Gracias por ayudar a mejorar el mundo.");
      form.reset();
      await loadReports();
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="page">
      <PageIntro label="SOPORTE" title="Un mundo mejor empieza con tu reporte.">
        Describe lo que ocurrió, qué esperabas y cómo podemos reproducir el
        problema.
      </PageIntro>
      <div className="support-layout">
        <Protected>
          <form data-reveal="rise" className="panel" onSubmit={submit}>
            <label>
              Título del problema
              <input
                name="title"
                required
                maxLength={140}
                placeholder="Ej. El juego se cierra al cargar un mundo"
              />
            </label>
            <div className="form-row">
              <label>
                Versión
                <select name="release_id">
                  <option value="">Otra / no estoy seguro</option>
                  {items.map((r) => (
                    <option value={r.id} key={r.id}>
                      {r.version} — {r.title}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Plataforma
                <select name="platform" required>
                  <option>Windows</option>
                  <option>Linux</option>
                  <option>macOS</option>
                  <option>Otra</option>
                </select>
              </label>
            </div>
            <label>
              ¿Qué ocurrió?
              <textarea
                name="description"
                required
                minLength={15}
                maxLength={5000}
                rows={4}
                placeholder="Describe el problema y el resultado esperado."
              />
            </label>
            <label>
              Pasos para reproducirlo
              <textarea
                name="steps"
                required
                minLength={10}
                maxLength={5000}
                rows={4}
                placeholder={
                  "1. Abro el juego…\n2. Cargo el mundo…\n3. Ocurre…"
                }
              />
            </label>
            <label>
              Captura opcional (máximo 10 MB)
              <input
                name="attachment"
                type="file"
                accept="image/png,image/jpeg,image/webp"
              />
            </label>
            <Notice error={error} text={success} />
            <button className="button" disabled={busy}>
              {busy ? (
                <LoaderCircle className="spin" size={18} />
              ) : (
                <Bug size={18} />
              )}{" "}
              Enviar reporte
            </button>
          </form>
        </Protected>
        <aside>
          <div className="panel" data-reveal="rise">
            <Bug className="accent" />
            <h2>Los detalles ayudan.</h2>
            <p>
              Incluye el sistema operativo, la versión del juego y los pasos
              exactos. Evita compartir contraseñas o datos personales en el
              reporte.
            </p>
          </div>
          {auth.user && (
            <div className="panel" data-reveal="rise">
              <h3>Mis reportes</h3>
              {reports.length ? (
                reports.map((r) => (
                  <div className="report-row" key={r.id}>
                    <strong>{r.title}</strong>
                    <span className="tag">
                      {
                        (
                          {
                            open: "Abierto",
                            in_progress: "En revisión",
                            resolved: "Resuelto",
                            closed: "Cerrado",
                          } as Record<string, string>
                        )[r.status]
                      }
                    </span>
                  </div>
                ))
              ) : (
                <p>Tus reportes aparecerán aquí.</p>
              )}
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
function Privacy() {
  return (
    <section className="page narrow">
      <PageIntro label="PRIVACIDAD" title="Tus datos, con claridad." />
      <div className="panel markdown" data-reveal="copy">
        <h2>Qué guardamos</h2>
        <p>
          El correo y las credenciales de acceso se gestionan mediante InsForge.
          Tu perfil contiene un nickname, un nombre visible y una biografía
          opcional. Los reportes incluyen su contenido y los archivos que
          decidas adjuntar.
        </p>
        <h2>Para qué los usamos</h2>
        <p>
          Para darte acceso a tu cuenta, mantener tu identidad en el proyecto y
          atender errores. El nickname se prepara para una futura integración
          con Infinity Elemental, que aún no está disponible.
        </p>
        <h2>Quién puede acceder</h2>
        <p>
          Puedes consultar y editar tu perfil. El equipo administrador puede
          atender tus reportes. Los archivos de las versiones publicadas y sus
          notas están disponibles al público.
        </p>
        <h2>Solicitudes sobre tus datos</h2>
        <p>
          Contacta con el equipo en{" "}
          <a
            href="https://www.threads.com/@ap.multiverse"
            target="_blank"
            rel="noreferrer"
          >
            @ap.multiverse
          </a>{" "}
          para solicitar ayuda con tu cuenta o la eliminación de datos. No
          publiques contraseñas ni información privada.
        </p>
      </div>
    </section>
  );
}
function Admin() {
  const { items, loading, error: loadError, load } = useReleases(true);
  const [editing, setEditing] = useState<Release | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const [content, setContent] = useState("");
  const [preview, setPreview] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [tab, setTab] = useState("releases");
  const auth = useAuth();
  async function open(r: Release | null) {
    setError("");
    setSuccess("");
    setEditing(r);
    setCreating(true);
    setContent(r?.content || "");
    setAssets(
      r
        ? (check(
            await backend.database
              .from("ie_release_assets")
              .select("*")
              .eq("release_id", r.id),
          ) as Asset[])
        : [],
    );
  }
  useEffect(() => {
    if (tab === "bugs")
      backend.database
        .from("ie_bug_reports")
        .select("*")
        .order("created_at", { ascending: false })
        .then((r) => {
          if (r.error) setError(message(r.error));
          else setReports(r.data || []);
        });
  }, [tab]);
  async function upload(bucket: string, file: File) {
    const key = `${auth.user!.id}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    if (bucket === "ie-builds") return (await uploadBuild(key, file)).url;
    return check(await backend.storage.from(bucket).upload(key, file))!.url;
  }
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const f = new FormData(form);
      let cover_url = editing?.cover_url || "";
      const cover = f.get("cover") as File;
      if (cover?.size) {
        if (cover.size > 10 * 1024 * 1024)
          throw Error("La portada no puede superar 10 MB.");
        cover_url = await upload("ie-media", cover);
      }
      const status = String(f.get("status"));
      const record = {
        title: String(f.get("title")),
        version: String(f.get("version")),
        summary: String(f.get("summary")),
        content,
        cover_url,
        status: "draft",
        published_at: null,
        author_id: auth.user!.id,
      };
      const saved = check(
        await (
          editing
            ? backend.database
                .from("ie_releases")
                .update(record)
                .eq("id", editing.id)
            : backend.database.from("ie_releases").insert(record)
        )
          .select()
          .single(),
      ) as Release;
      setEditing(saved);
      const files = f.getAll("builds") as File[];
      for (const file of files.filter((x) => x.size)) {
        if (file.size > 500 * 1024 * 1024)
          throw Error("Cada archivo debe ser menor de 500 MB.");
        const url = await upload("ie-builds", file);
        check(
          await backend.database.from("ie_release_assets").insert({
            release_id: saved.id,
            name: file.name,
            platform: String(f.get("platform")),
            url,
            size: file.size,
          }),
        );
      }
      if (status === "published") {
        check(
          await backend.database
            .from("ie_releases")
            .update({
              status: "published",
              published_at: editing?.published_at || new Date().toISOString(),
            })
            .eq("id", saved.id),
        );
        setEditing({
          ...saved,
          status: "published",
          published_at: editing?.published_at || new Date().toISOString(),
        });
      }
      setAssets(
        check(
          await backend.database
            .from("ie_release_assets")
            .select("*")
            .eq("release_id", saved.id),
        ) as Asset[],
      );
      await load();
      for (const input of form.querySelectorAll<HTMLInputElement>(
        'input[type="file"]',
      ))
        input.value = "";
      setSuccess(
        status === "published" ? "Versión publicada." : "Borrador guardado.",
      );
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="page">
      <PageIntro
        label="PANEL DEL EQUIPO"
        title="Construye la próxima actualización."
      >
        Gestiona versiones, archivos de descarga y reportes de la comunidad.
      </PageIntro>
      <div className="tabs">
        <button
          className={tab === "releases" ? "active" : ""}
          onClick={() => setTab("releases")}
        >
          Versiones
        </button>
        <button
          className={tab === "bugs" ? "active" : ""}
          onClick={() => setTab("bugs")}
        >
          Reportes de bugs
        </button>
      </div>
      <Notice error={error || loadError} text={success} />
      {tab === "releases" ? (
        <>
          {!creating && (
            <button className="button" onClick={() => void open(null)}>
              <Plus size={18} /> Nueva versión
            </button>
          )}
          {creating ? (
            <form
              className="panel editor"
              onSubmit={save}
              key={editing?.id || "new"}
            >
              <div className="section-heading" data-motion-group>
                <h2>{editing ? "Editar versión" : "Nueva versión"}</h2>
                <button
                  type="button"
                  className="icon-button"
                  aria-label="Cerrar editor"
                  onClick={() => {
                    setCreating(false);
                    setEditing(null);
                  }}
                >
                  <X />
                </button>
              </div>
              <div className="form-row">
                <label>
                  Título
                  <input
                    name="title"
                    required
                    maxLength={150}
                    defaultValue={editing?.title}
                  />
                </label>
                <label>
                  Versión
                  <input
                    name="version"
                    required
                    maxLength={40}
                    defaultValue={editing?.version}
                    placeholder="Ej. 0.1.0-beta"
                  />
                </label>
              </div>
              <label>
                Descripción breve
                <textarea
                  name="summary"
                  required
                  maxLength={500}
                  defaultValue={editing?.summary}
                  rows={2}
                />
              </label>
              <label>
                Imagen de portada
                <input
                  name="cover"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                />
              </label>
              <div className="editor-tools">
                <span>Contenido de la publicación · Markdown</span>
                <button
                  type="button"
                  className="text-link"
                  onClick={() => setPreview(!preview)}
                >
                  {preview ? "Editar texto" : "Vista previa"}
                </button>
                <label className="upload-inline">
                  <ImagePlus size={17} /> Insertar imagen
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    disabled={busy}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setBusy(true);
                      try {
                        if (file.size > 10 * 1024 * 1024)
                          throw Error("La imagen no puede superar 10 MB.");
                        const url = await upload("ie-media", file);
                        setContent(
                          (c) => c + `\n\n![Captura del juego](${url})\n`,
                        );
                      } catch (e) {
                        setError(message(e));
                      } finally {
                        setBusy(false);
                      }
                    }}
                  />
                </label>
              </div>
              {preview ? (
                <div className="markdown preview">
                  <ReactMarkdown>{content}</ReactMarkdown>
                </div>
              ) : (
                <textarea
                  aria-label="Contenido de la versión"
                  className="content-editor"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={16}
                  required
                  placeholder={
                    "## Novedades\n\nDescribe las implementaciones.\n\n### Cambios\n- Una mejora…\n\nPuedes insertar imágenes con el botón de arriba."
                  }
                />
              )}
              <div className="form-row">
                <label>
                  Archivos de la versión (hasta 500 MB por archivo)
                  <input name="builds" type="file" multiple />
                  <small>
                    Para archivos de más de 90 MB, mantén Tailscale conectado en
                    este equipo.
                  </small>
                </label>
                <label>
                  Plataforma de los archivos nuevos
                  <select name="platform">
                    <option>Windows</option>
                    <option>Linux</option>
                    <option>macOS</option>
                    <option>Multiplataforma</option>
                  </select>
                </label>
              </div>
              {assets.map((a) => (
                <div className="download-row" key={a.id}>
                  <span>
                    {a.name} · {a.platform}
                  </span>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={"Quitar " + a.name}
                    onClick={async () => {
                      try {
                        check(
                          await backend.database
                            .from("ie_release_assets")
                            .delete()
                            .eq("id", a.id),
                        );
                        setAssets((v) => v.filter((x) => x.id !== a.id));
                      } catch (e) {
                        setError(message(e));
                      }
                    }}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              ))}
              <label>
                Visibilidad
                <select name="status" defaultValue={editing?.status || "draft"}>
                  <option value="draft">Borrador · solo administradores</option>
                  <option value="published">
                    Publicada · visible para todos
                  </option>
                </select>
              </label>
              <Notice error={error} text={success} />
              <button className="button" disabled={busy}>
                {busy ? (
                  <LoaderCircle className="spin" size={18} />
                ) : (
                  <Check size={18} />
                )}{" "}
                Guardar versión
              </button>
            </form>
          ) : loading ? (
            <Loading />
          ) : (
            <div className="admin-list">
              {items.map((r) => (
                <button
                  className="panel admin-release"
                  key={r.id}
                  onClick={() => void open(r)}
                >
                  <div>
                    <span className="tag">
                      {r.status === "published" ? "PUBLICADA" : "BORRADOR"} ·{" "}
                      {r.version}
                    </span>
                    <h3>{r.title}</h3>
                    <p>{r.summary}</p>
                  </div>
                  <ChevronRight />
                </button>
              ))}
              {!items.length && (
                <div className="empty" data-reveal="panel">
                  <h2>Tu primera versión empieza aquí.</h2>
                  <p>
                    Crea un borrador, escribe sus notas y adjunta los archivos.
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="admin-list">
          {reports.map((r) => (
            <article className="panel" key={r.id}>
              <span className="tag">
                {r.platform} · {new Date(r.created_at).toLocaleDateString("es")}
              </span>
              <h2>{r.title}</h2>
              <p className="pre-wrap">{r.description}</p>
              <h3>Pasos para reproducir</h3>
              <p className="pre-wrap">{r.steps}</p>
              {r.attachment_url && (
                <button
                  type="button"
                  className="text-link"
                  onClick={async () => {
                    try {
                      const u = new URL(r.attachment_url);
                      const key = decodeURIComponent(
                        u.pathname.split("/objects/")[1],
                      );
                      const blob = check(
                        await backend.storage
                          .from("ie-bug-attachments")
                          .download(key),
                      );
                      const url = URL.createObjectURL(blob!);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "captura-bug";
                      a.click();
                      setTimeout(() => URL.revokeObjectURL(url), 10000);
                    } catch (e) {
                      setError(message(e));
                    }
                  }}
                >
                  Descargar captura <Download size={17} />
                </button>
              )}
              <label>
                Estado
                <select
                  value={r.status}
                  onChange={async (e) => {
                    const status = e.target.value;
                    try {
                      check(
                        await backend.database
                          .from("ie_bug_reports")
                          .update({ status })
                          .eq("id", r.id),
                      );
                      setReports((v) =>
                        v.map((x) => (x.id === r.id ? { ...x, status } : x)),
                      );
                    } catch (e) {
                      setError(message(e));
                    }
                  }}
                >
                  <option value="open">Abierto</option>
                  <option value="in_progress">En revisión</option>
                  <option value="resolved">Resuelto</option>
                  <option value="closed">Cerrado</option>
                </select>
              </label>
            </article>
          ))}
          {!reports.length && (
            <div className="empty" data-reveal="panel">
              <Bug size={40} />
              <h2>No hay reportes pendientes.</h2>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Layout />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
