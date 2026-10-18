import { Link, NavLink } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { TID } from "@/lib/tids";
import { Orbit, Sun, Moon } from "lucide-react";
import CommandPalette from "@/components/CommandPalette";
import { useTheme } from "@/lib/theme";
const navClass = ({isActive}) => `platform-nav-link ${isActive ? 'active' : ''}`;
export default function Nav() {
 const {user,logout}=useAuth(); const {theme,toggle}=useTheme();
 return <header data-testid={TID.nav} className="platform-header">
  <a className="skip-link" href="#main-content">Skip to content</a>
  <div className="platform-topbar"><Link to="/" data-testid={TID.navLogo} className="platform-brand"><span><Orbit size={24}/></span><div>Science of Autonomy<small>UNDERSTAND. EXPERIMENT. GROW.</small></div></Link>
   <div className="platform-actions"><CommandPalette/><button onClick={toggle} aria-label="Toggle theme" className="platform-theme">{theme==='light'?<Moon size={17}/>:<Sun size={17}/>}</button>
    {user ? <><span className="platform-user">{user.name}</span><button data-testid={TID.navLogout} onClick={logout} className="soa-btn-ghost">Sign out</button></> : <><Link to="/login" data-testid={TID.navLogin} className="soa-btn-ghost">Sign in</Link><Link to="/register" data-testid={TID.navRegister} className="soa-btn-primary">Join & learn</Link></>}
   </div></div>
  <nav className="platform-nav" aria-label="Main navigation"><NavLink to="/learn" className={navClass}>My learning</NavLink><NavLink to="/simulator" data-testid="nav-link-simulator" className={navClass}>Flight playground</NavLink><NavLink to="/assessment" data-testid={TID.navLinkAssessment} className={navClass}>Dronability practice</NavLink><NavLink to="/tracks" data-testid={TID.navLinkTracks} className={navClass}>Topic library</NavLink><NavLink to="/glossary" className={navClass}>Glossary</NavLink>{user && <NavLink to="/dashboard" className={navClass}>Activity</NavLink>}{['instructor','admin'].includes(user?.role)&&<NavLink to="/instructor" className={navClass}>Instructor workspace</NavLink>}{user?.role==='admin'&&<NavLink to="/admin" className={navClass}>Content admin</NavLink>}<span className="platform-edition">Online preview · v0.3</span></nav>
 </header>;
}
