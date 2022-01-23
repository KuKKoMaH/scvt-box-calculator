import style from '!!css-loader?modules=local!postcss-loader!sass-loader!./style.scss';

export const modules = style.locals;
export const styles = process.env.NODE_ENV === 'production' ? style[0][1] : '';
