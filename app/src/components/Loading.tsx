import styles from './Loading.module.css';

interface LoadingProps {
  size?: 'small' | 'medium' | 'large';
  fullScreen?: boolean;
  text?: string;
}

export default function Loading({ 
  size = 'medium', 
  fullScreen = false,
  text 
}: LoadingProps) {
  const content = (
    <div className={styles.loadingContent}>
      <div className={`${styles.spinner} ${styles[size]}`}></div>
      {text && <p className={styles.text}>{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className={styles.fullScreen}>
        {content}
      </div>
    );
  }

  return content;
}
