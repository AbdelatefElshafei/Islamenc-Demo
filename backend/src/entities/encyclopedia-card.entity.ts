import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Encyclopedia } from './encyclopedia.entity';
import { EncyclopediaCardVersion } from './encyclopedia-card-version.entity';

@Entity('encyclopedia_cards')
export class EncyclopediaCard {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'encyclopedia_id' })
    encyclopediaId: number;

    @ManyToOne(() => Encyclopedia, (enc) => enc.cards, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'encyclopedia_id' })
    encyclopedia: Encyclopedia;

    @Column({ length: 255 })
    title: string;

    @Column({ length: 255, unique: true })
    slug: string;

    @OneToMany(() => EncyclopediaCardVersion, (version) => version.card)
    versions: EncyclopediaCardVersion[];
}
