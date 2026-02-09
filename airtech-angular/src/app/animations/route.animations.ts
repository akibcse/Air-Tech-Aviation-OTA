import { trigger, transition, style, animate, query, group } from '@angular/animations';

export const routeAnimation = trigger('routeAnimation', [
    transition('* <=> *', [
        style({ position: 'relative' }),
        query(':enter, :leave', [
            style({
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                opacity: 0,
                transform: 'translateY(10px)'
            })
        ], { optional: true }),
        query(':enter', [
            style({ opacity: 0, transform: 'translateY(10px)' })
        ], { optional: true }),
        group([
            query(':leave', [
                animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(-10px)' }))
            ], { optional: true }),
            query(':enter', [
                animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
            ], { optional: true })
        ])
    ])
]);
