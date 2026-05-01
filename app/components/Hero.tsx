
// app/components/Hero.tsx
import styles from './Hero.module.css';

const Hero = () => {
  return (
    <div className={styles.hero}>
      <div className={styles.overlay} />
      <div className={styles.content}>
        <h1 className={styles.title}>مكتبات دار اللغات</h1>
        {/* The subtitle text has been changed and styled to be white */}
        <p 
          className={styles.subtitle}
          style={{ color: '#FFFFFF' }} // Added inline style for white color
        >
          مستقبل أطفالك يبدأ هنا
        </p>
      </div>
    </div>
  );
};

export default Hero;
