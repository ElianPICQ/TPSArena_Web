import oflOrbitron from '../assets/fonts/OFL-Orbitron.txt?url';
import oflRajdhani from '../assets/fonts/OFL-Rajdhani.txt?url';
import oflNoto from '../assets/fonts/OFL-NotoSansJP.txt?url';

export function Footer() {
  return (
    <footer className="footer">
      <p className="footer__project">
        Projet M2 Architecture SI — <span className="accent-cyan">CFA INSTA</span>
      </p>
      <p className="footer__credits">
        Polices sous licence SIL Open Font License 1.1 : <a href={oflOrbitron}>Orbitron</a>,{' '}
        <a href={oflRajdhani}>Rajdhani</a> et <a href={oflNoto}>Noto Sans JP</a>.
      </p>
    </footer>
  );
}
