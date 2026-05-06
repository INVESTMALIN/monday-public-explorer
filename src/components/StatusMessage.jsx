const TONE_TEXT = {
  neutral: 'text-neutral-500 dark:text-neutral-400',
  error: 'text-red-600 dark:text-red-400',
};

const TONE_ICON = {
  neutral: 'text-neutral-400 dark:text-neutral-500',
  error: 'text-red-500 dark:text-red-400',
};

export default function StatusMessage({
  icon: Icon,
  text,
  tone = 'neutral',
  iconClassName = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-16 ${TONE_TEXT[tone]}`}>
      {Icon && (
        <Icon
          className={`h-8 w-8 ${TONE_ICON[tone]} ${iconClassName}`}
          aria-hidden="true"
        />
      )}
      <p className="text-sm">{text}</p>
    </div>
  );
}
