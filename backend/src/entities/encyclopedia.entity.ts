import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { EncyclopediaCard } from './encyclopedia-card.entity';

@Entity('encyclopedias')
export class Encyclopedia {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 255 })
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @OneToMany(() => EncyclopediaCard, (card) => card.encyclopedia)
    cards: EncyclopediaCard[];
}
